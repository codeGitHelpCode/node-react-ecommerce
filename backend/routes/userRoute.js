import express from 'express';
import User from '../models/userModel';
import { getToken, isAuth } from '../util';

const router = express.Router();

router.put('/:id', isAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        password: req.body.password || user.password,
      });
      res.send({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: getToken(user),
      });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  } catch (error) {
    console.error('用户更新失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const signinUser = await User.findOne({
      where: {
        email: req.body.email,
        password: req.body.password,
      }
    });
    if (signinUser) {
      res.send({
        id: signinUser.id,
        name: signinUser.name,
        email: signinUser.email,
        isAdmin: signinUser.isAdmin,
        token: getToken(signinUser),
      });
    } else {
      res.status(401).send({ message: 'Invalid Email or Password.' });
    }
  } catch (error) {
    console.error('登录失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({
      where: { email: req.body.email }
    });
    
    if (existingUser) {
      return res.status(409).send({ message: 'Email already exists' });
    }

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    
    res.send({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: getToken(user),
    });
  } catch (error) {
    console.error('注册失败:', error.message);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

router.get('/createadmin', async (req, res) => {
  try {
    // 检查管理员是否已存在
    const existingAdmin = await User.findOne({
      where: { email: 'admin@example.com' }
    });
    
    if (existingAdmin) {
      return res.send({ message: 'Admin user already exists', user: existingAdmin });
    }

    const user = await User.create({
      name: 'Basir',
      email: 'admin@example.com',
      password: '1234',
      isAdmin: true,
    });
    res.send(user);
  } catch (error) {
    console.error('创建管理员失败:', error.message);
    res.status(500).send({ message: error.message });
  }
});

export default router;