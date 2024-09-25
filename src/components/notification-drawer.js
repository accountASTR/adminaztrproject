import React, { useEffect } from 'react';
import { Button, Drawer, List } from 'antd';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu } from 'redux/slices/menu';
import { useNavigate } from 'react-router-dom';
import notificationService from 'services/notification';

export default function NotificationDrawer({
  handleClose,
  visible,
  list,
  readAll,
  loading,
  paginate,
  setPaginate,
}) {
  const { user } = useSelector((state) => state.auth, shallowEqual);
  const { direction } = useSelector((state) => state.theme.theme, shallowEqual);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const goToShow = (id) => {
    let url = '';
    switch (user.role) {
      case 'admin':
        url = `order/details/${id}`;
        break;
      case 'manager':
        url = `order/details/${id}`;
        break;
      case 'seller':
        url = `seller/order/details/${id}`;
        break;
      case 'moderator':
        url = `seller/order/details/${id}`;
        break;
      case 'deliveryman':
        url = `deliveryman/order/details/${id}`;
        break;

      default:
        break;
    }
    dispatch(
      addMenu({
        url,
        id: 'order_details',
        name: t('order.details'),
      }),
    );
    navigate(`/${url}`);
  };

  const fetchReadAtNotification = (id) => {
    notificationService.readAt(id).then(() => {});
  };

  const handleClickNotification = (item) => {
    if (item?.model_type === 'order') {
      const orderId = item?.data?.id;
      const id = item?.id;
      handleClose();
      goToShow(orderId);
      fetchReadAtNotification(id);
    }
  };

  const handleReadAll = () => {
    readAll().finally(() => handleClose());
  };

  return (
    <Drawer
      title={t('notifications')}
      placement={direction === 'rtl' ? 'right' : 'left'}
      closable={false}
      onClose={handleClose}
      visible={visible}
      key={'left'}
      extra={<Button onClick={handleReadAll}>{t('read.all')}</Button>}
    >
      <List
        size='small'
        itemLayout='horizontal'
        dataSource={list}
        loading={loading}
        renderItem={(item) => (
          <List.Item
            className='list-clickable'
            onClick={() => handleClickNotification(item)}
          >
            <div
              className='py-1'
              style={{
                display: 'flex',
                alignItems: 'center',
                columnGap: '10px',
              }}
            >
              {!item?.read_at && (
                <span
                  style={{
                    display: 'block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'tomato',
                  }}
                />
              )}
              <span className='font-weight-bold'>{item?.title}</span>
            </div>
          </List.Item>
        )}
      />
      <Button
        onClick={() => setPaginate({ page: paginate.page + 1 })}
        className='w-100 mt-4'
        type='primary'
        disabled={loading}
      >
        {t('load.more')}
      </Button>
    </Drawer>
  );
}
