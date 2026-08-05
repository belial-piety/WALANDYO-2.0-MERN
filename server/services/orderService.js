const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const OrderAuditLog = require('../models/OrderAuditLog');
const Branch = require('../models/Branch');
const AppError = require('../utils/appError');
const inventoryService = require('./inventoryService');

class OrderService {
  async createOrder({ branchId, cashierId, cashierName, paymentMethod, items }) {
    if (!branchId) throw new AppError('Branch ID is required', 400);
    if (!['cash', 'gcash', 'card'].includes(paymentMethod)) {
      throw new AppError('Invalid payment method', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order cart cannot be empty', 400);
    }

    const branch = await Branch.findById(branchId);
    if (!branch || !branch.isActive) {
      throw new AppError('Branch is invalid or inactive', 400);
    }

    const session = await mongoose.startSession();
    let createdOrder;

    try {
      await session.withTransaction(async () => {
        const orderItems = [];
        let subtotal = 0;
        const stockUpdates = [];

        for (const item of items) {
          if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
            throw new AppError('Invalid cart item structure', 400);
          }

          const menuItem = await MenuItem.findById(item.menuItemId).session(session);
          if (!menuItem || menuItem.isArchived || !menuItem.isAvailable) {
            throw new AppError(`Item "${item.menuItemId}" is no longer available for sale`, 400);
          }

          const inv = await Inventory.findOne({
            menuItem: menuItem._id,
            branch: branchId,
          }).session(session);

          if (!inv) {
            throw new AppError(`Inventory record missing for item "${menuItem.name}"`, 400);
          }

          if (inv.currentStock < item.quantity) {
            throw new AppError(
              `Insufficient stock for "${menuItem.name}". Requested: ${item.quantity}, Available: ${inv.currentStock}`,
              409
            );
          }

          const unitPrice = Number(menuItem.price);
          const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
          subtotal += lineTotal;

          orderItems.push({
            menuItem: menuItem._id,
            itemName: menuItem.name,
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          });

          stockUpdates.push({
            inventoryId: inv._id,
            menuItemId: menuItem._id,
            menuItemName: menuItem.name,
            qtyToDeduct: item.quantity,
          });
        }

        subtotal = Number(subtotal.toFixed(2));
        const taxRate = Number(process.env.TAX_RATE || 0);
        const tax = Number((subtotal * taxRate).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));

        // Generate unique order number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `ORD-${dateStr}-${randomNum}`;

        const [order] = await Order.create(
          [
            {
              orderNumber,
              branch: branchId,
              cashier: cashierId,
              cashierNameSnap: cashierName || 'Cashier',
              status: 'completed',
              paymentMethod,
              items: orderItems,
              subtotal,
              tax,
              total,
            },
          ],
          { session }
        );

        // Deduct inventory atomically
        for (const update of stockUpdates) {
          const res = await Inventory.findOneAndUpdate(
            {
              _id: update.inventoryId,
              currentStock: { $gte: update.qtyToDeduct },
            },
            { $inc: { currentStock: -update.qtyToDeduct } },
            { new: true, session }
          );

          if (!res) {
            throw new AppError(
              `Stock for item "${update.menuItemName}" changed during checkout. Please retry.`,
              409
            );
          }

          // Create stock movement record
          await StockMovement.create(
            [
              {
                inventory: res._id,
                branch: branchId,
                menuItem: update.menuItemId,
                changeQty: -update.qtyToDeduct,
                type: 'sale',
                referenceOrder: order._id,
                createdBy: cashierId,
                notes: `Sale - Order #${orderNumber}`,
              },
            ],
            { session }
          );

          // Check low stock condition
          await inventoryService.checkAndCreateLowStockNotification(
            res,
            update.menuItemName,
            branchId,
            session
          );
        }

        // Audit log
        await OrderAuditLog.create(
          [
            {
              order: order._id,
              action: 'created',
              notes: `Order created via POS (${paymentMethod.toUpperCase()})`,
              staff: cashierId,
              staffNameSnap: cashierName,
            },
          ],
          { session }
        );

        createdOrder = order;
      });
    } finally {
      session.endSession();
    }

    return createdOrder;
  }

  async voidOrder(orderId, voidReason, user) {
    if (!voidReason || !voidReason.trim()) {
      throw new AppError('Void reason is required', 400);
    }

    const session = await mongoose.startSession();
    let voidedOrder;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw new AppError('Order not found', 404);

        if (order.status === 'voided') {
          throw new AppError('Order has already been voided', 400);
        }

        order.status = 'voided';
        order.voidReason = voidReason.trim();
        order.voidedAt = new Date();
        order.voidedBy = user._id;
        await order.save({ session });

        // Restore stock
        for (const item of order.items) {
          const inv = await Inventory.findOneAndUpdate(
            { menuItem: item.menuItem, branch: order.branch },
            { $inc: { currentStock: item.quantity } },
            { new: true, session }
          );

          if (inv) {
            await StockMovement.create(
              [
                {
                  inventory: inv._id,
                  branch: order.branch,
                  menuItem: item.menuItem,
                  changeQty: item.quantity,
                  type: 'void_restore',
                  referenceOrder: order._id,
                  createdBy: user._id,
                  notes: `Void Order #${order.orderNumber}: ${voidReason.trim()}`,
                },
              ],
              { session }
            );

            // If stock restored above minLevel, clear low stock alerts
            if (inv.currentStock > inv.minLevel) {
              await Notification.updateMany(
                { inventory: inv._id, isRead: false },
                { $set: { isRead: true, readAt: new Date(), readBy: user._id } },
                { session }
              );
            }
          }
        }

        await OrderAuditLog.create(
          [
            {
              order: order._id,
              action: 'voided',
              notes: `Voided by ${user.fullName}: ${voidReason.trim()}`,
              staff: user._id,
              staffNameSnap: user.fullName,
            },
          ],
          { session }
        );

        voidedOrder = order;
      });
    } finally {
      session.endSession();
    }

    return voidedOrder;
  }
}

module.exports = new OrderService();
