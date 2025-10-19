import express from 'express';
import sequelize from '../config/database';
import Order, { OrderItem } from '../models/orderModel';
import User from '../models/userModel';
import { isAuth, isAdmin } from '../util';

const router = express.Router();

User.hasMany(Order, { foreignKey: 'userId', as: 'orders'})
Order.belongsTo(User, { foreignKey: 'userId', as: 'user'})

router.get("/", isAuth, isAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }, {
        model: OrderItem,
        as: 'orderItems'
      }]
    });
    res.send(orders);
  } catch (error) {
    console.error('获取订单列表失败:', error.message);
    console.error('错误详情:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get("/mine", isAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{
        model: OrderItem,
        as: 'orderItems'
      }]
    });
    res.send(orders);
  } catch (error) {
    console.error('获取用户订单失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get("/:id", isAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderItem,
        as: 'orderItems'
      }]
    });
    
    if (order) {
      res.send(order);
    } else {
      res.status(404).send("Order Not Found.");
    }
  } catch (error) {
    console.error('获取订单详情失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.delete("/:id", isAuth, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (order) {
      // 删除订单项
      await OrderItem.destroy({
        where: { orderId: order.id }
      });
      
      // 删除订单
      await order.destroy();
      
      res.send({ message: 'Order deleted successfully' });
    } else {
      res.status(404).send("Order Not Found.");
    }
  } catch (error) {
    console.error('删除订单失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post("/", isAuth, async (req, res) => {
  try {
    // 使用事务确保数据一致性
    const transaction = await sequelize.transaction();
    
    try {
      // 创建订单
      const newOrder = await Order.create({
        userId: req.user.id,
        shippingAddress: req.body.shipping.address,
        shippingCity: req.body.shipping.city,
        shippingPostalCode: req.body.shipping.postalCode,
        shippingCountry: req.body.shipping.country,
        paymentMethod: req.body.payment.paymentMethod,
        itemsPrice: req.body.itemsPrice,
        taxPrice: req.body.taxPrice,
        shippingPrice: req.body.shippingPrice,
        totalPrice: req.body.totalPrice,
      }, { transaction });

      // 创建订单项
      const orderItems = req.body.orderItems.map(item => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        productId: item.product,
        orderId: newOrder.id
      }));
      
      await OrderItem.bulkCreate(orderItems, { transaction });
      
      await transaction.commit();
      
      res.status(201).send({ 
        message: "New Order Created", 
        data: newOrder 
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('创建订单失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.put("/:id/pay", isAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    
    if (order) {
      await order.update({
        isPaid: true,
        paidAt: new Date(),
        paymentMethod: 'paypal',
        // 可以添加更多支付信息字段
      });
      
      res.send({ 
        message: 'Order Paid.', 
        order: order 
      });
    } else {
      res.status(404).send({ message: 'Order not found.' });
    }
  } catch (error) {
    console.error('支付订单失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

export default router;