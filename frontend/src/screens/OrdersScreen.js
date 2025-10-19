import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { listOrders, deleteOrder } from '../actions/orderActions';

function OrdersScreen(props) {
  const orderList = useSelector(state => state.orderList);
  const { loading, orders, error } = orderList;

  const orderDelete = useSelector(state => state.orderDelete);
  const { loading: loadingDelete, success: successDelete, error: errorDelete } = orderDelete;

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(listOrders());
    return () => {
      //
    };
  }, [dispatch, successDelete]);

  const deleteHandler = (order) => {
    if (window.confirm('确定要删除这个订单吗？')) {
      dispatch(deleteOrder(order.id));
    }
  }

  return (
    <div className="content content-margined">
      <div className="order-header">
        <h3>订单管理</h3>
      </div>
      
      {loading ? (
        <div>加载中...</div>
      ) : error ? (
        <div>错误: {error}</div>
      ) : !orders || orders.length === 0 ? (
        <div>暂无订单</div>
      ) : (
        <div className="order-list">
          <table className="table">
            <thead>
              <tr>
                <th>订单ID</th>
                <th>日期</th>
                <th>总金额</th>
                <th>用户</th>
                <th>已支付</th>
                <th>支付时间</th>
                <th>已发货</th>
                <th>发货时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                  <td>¥{order.totalPrice}</td>
                  <td>{order.user ? order.user.name : '-'}</td>
                  <td>{order.isPaid ? '是' : '否'}</td>
                  <td>{order.paidAt ? new Date(order.paidAt).toLocaleDateString() : '-'}</td>
                  <td>{order.isDelivered ? '是' : '否'}</td>
                  <td>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <Link to={"/order/" + order.id} className="button secondary">
                      详情
                    </Link>
                    {' '}
                    <button 
                      type="button" 
                      onClick={() => deleteHandler(order)} 
                      className="button secondary"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersScreen;