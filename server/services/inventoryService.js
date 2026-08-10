const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Branch = require('../models/Branch');
const MenuItem = require('../models/MenuItem');
const StockMovement = require('../models/StockMovement');
const Notification = require('../models/Notification');
const AppError = require('../utils/appError');

class InventoryService {
  /**
   * Called when a new MenuItem is created.
   * Creates an inventory record for every active branch.
   */
  async ensureBranchInventoryForMenuItem(menuItem, session = null) {
    const branches = await Branch.find({ isActive: true }).session(session);
    const docs = branches.map((b) => ({
      menuItem: menuItem._id,
      branch: b._id,
      currentStock: 0,
      minLevel: 10,
      unit: 'pcs',
    }));

    if (docs.length > 0) {
      await Inventory.insertMany(docs, { session, ordered: false }).catch((err) => {
        // Ignore duplicate key errors if already exists
        if (err.code !== 11000) throw err;
      });
    }
  }

  /**
   * Called when a new Branch is created.
   * Creates inventory records for all non-archived menu items for this branch.
   */
  async ensureMenuItemInventoryForBranch(branch, session = null) {
    const menuItems = await MenuItem.find({ isArchived: false }).session(session);
    const docs = menuItems.map((item) => ({
      menuItem: item._id,
      branch: branch._id,
      currentStock: 0,
      minLevel: 10,
      unit: 'pcs',
    }));

    if (docs.length > 0) {
      await Inventory.insertMany(docs, { session, ordered: false }).catch((err) => {
        if (err.code !== 11000) throw err;
      });
    }
  }

  /**
   * Generates or updates low-stock notifications for an inventory item.
   */
  async checkAndCreateLowStockNotification(inventoryDoc, itemName, branchId, session = null) {
    if (inventoryDoc.currentStock <= inventoryDoc.minLevel) {
      const type = inventoryDoc.currentStock <= 0 ? 'out_of_stock' : 'low_stock';
      const message =
        inventoryDoc.currentStock <= 0
          ? `${itemName} is OUT OF STOCK.`
          : `${itemName} is running low (${inventoryDoc.currentStock} left, min ${inventoryDoc.minLevel}).`;

      try {
        // Keep a single unread alert per inventory item, but refresh it to reflect
        // the latest stock level/type (for example LOW STOCK -> OUT OF STOCK).
        await Notification.findOneAndUpdate(
          { branch: branchId, inventory: inventoryDoc._id, isRead: false },
          {
            $set: {
              menuItem: inventoryDoc.menuItem,
              message,
              type,
            },
            $setOnInsert: {
              branch: branchId,
              inventory: inventoryDoc._id,
              isRead: false,
            },
          },
          { upsert: true, new: true, session, setDefaultsOnInsert: true }
        );
      } catch (err) {
        // A concurrent stock update can race the unique unread-alert index.
        // In that rare case, the other operation has already created/refreshed it.
        if (err.code !== 11000) {
          console.error('Notification creation error:', err);
        }
      }
    }
  }

  /**
   * Restocks stock for a given inventory item.
   */
  async restockInventory(inventoryId, quantity, userId, notes = '') {
    if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
      throw new AppError('Restock quantity must be a positive integer', 400);
    }

    const session = await mongoose.startSession();
    let updatedInventory;

    try {
      await session.withTransaction(async () => {
        const inv = await Inventory.findById(inventoryId).populate('menuItem').session(session);
        if (!inv) throw new AppError('Inventory record not found', 404);

        inv.currentStock += Number(quantity);
        await inv.save({ session });

        await StockMovement.create(
          [
            {
              inventory: inv._id,
              branch: inv.branch,
              menuItem: inv.menuItem._id,
              changeQty: Number(quantity),
              type: 'restock',
              createdBy: userId,
              notes: notes || 'Manual restock',
            },
          ],
          { session }
        );

        // If stock is now above minLevel, auto-resolve/read unread low stock notification
        if (inv.currentStock > inv.minLevel) {
          await Notification.updateMany(
            { inventory: inv._id, isRead: false },
            { $set: { isRead: true, readAt: new Date(), readBy: userId } },
            { session }
          );
        }

        updatedInventory = inv;
      });
    } finally {
      session.endSession();
    }

    return updatedInventory;
  }

  /**
   * Deducts stock for spoilage, damage, wastage, or other manual adjustments.
   */
  async deductInventory(inventoryId, quantity, userId, notes = '') {
    const qty = Number(quantity);
    if (!quantity || qty <= 0 || !Number.isInteger(qty)) {
      throw new AppError('Deduction quantity must be a positive integer', 400);
    }

    const session = await mongoose.startSession();
    let updatedInventory;

    try {
      await session.withTransaction(async () => {
        const inv = await Inventory.findById(inventoryId).populate('menuItem').session(session);
        if (!inv) throw new AppError('Inventory record not found', 404);

        if (qty > inv.currentStock) {
          throw new AppError(
            `Deduction quantity cannot exceed current stock (${inv.currentStock} ${inv.unit})`,
            400
          );
        }

        inv.currentStock -= qty;
        await inv.save({ session });

        await StockMovement.create(
          [
            {
              inventory: inv._id,
              branch: inv.branch,
              menuItem: inv.menuItem._id,
              changeQty: -qty,
              type: 'adjustment',
              createdBy: userId,
              notes: notes || 'Manual stock deduction',
            },
          ],
          { session }
        );

        const itemName = inv.menuItem ? inv.menuItem.name : 'Item';
        await this.checkAndCreateLowStockNotification(
          inv,
          itemName,
          inv.branch,
          session
        );

        updatedInventory = inv;
      });
    } finally {
      session.endSession();
    }

    return updatedInventory;
  }

  /**
   * Updates minimum stock alert level for an item.
   */
  async updateMinLevel(inventoryId, minLevel) {
    if (minLevel < 0 || !Number.isInteger(Number(minLevel))) {
      throw new AppError('Minimum level must be a non-negative integer', 400);
    }

    const inv = await Inventory.findById(inventoryId).populate('menuItem');
    if (!inv) throw new AppError('Inventory record not found', 404);

    inv.minLevel = Number(minLevel);
    await inv.save();

    const itemName = inv.menuItem ? inv.menuItem.name : 'Item';
    await this.checkAndCreateLowStockNotification(inv, itemName, inv.branch);

    return inv;
  }
}

module.exports = new InventoryService();
