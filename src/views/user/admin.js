import React, { useEffect, useState, useContext } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExpandOutlined,
  EyeOutlined,
  LoginOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Table, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { data as menuData } from '../../configs/menu-config';
import { fetchUsers } from '../../redux/slices/user';
import formatSortType from '../../helpers/formatSortType';
import {
  addMenu,
  clearMenu,
  disableRefetch,
  setMenuData,
} from '../../redux/slices/menu';
import useDidUpdate from '../../helpers/useDidUpdate';
import UserShowModal from './userShowModal';
import { useTranslation } from 'react-i18next';
import UserRoleModal from './userRoleModal';
import SearchInput from '../../components/search-input';
import FilterColumns from '../../components/filter-column';
import DeleteButton from '../../components/delete-button';
import { Context } from '../../context/context';
import { toast } from 'react-toastify';
import deliveryService from '../../services/delivery';
import CustomModal from '../../components/modal';
import useDemo from '../../helpers/useDemo';
import userService from 'services/user';
import { setUserData } from '../../redux/slices/auth';
import { setCurrentChat } from '../../redux/slices/chat';
import { fetchRestSettings } from '../../redux/slices/globalSettings';
import { fetchMyShop } from '../../redux/slices/myShop';
import hideEmail from 'components/hideEmail';
const ReactAppIsDemo = process.env.REACT_APP_IS_DEMO;
//ReactAppIsDemo ? hideEmail(email) : email
const { TabPane } = Tabs;

const modalType = {
  SELLER_LOGIN: 'seller_login',
  DELETE: 'delete',
};

export default function Admin() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [id, setId] = useState(null);
  const [text, setText] = useState(null);
  const { setIsModalVisible } = useContext(Context);
  const [tabsLoading, setTabsLoading] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { users, loading, meta, params } = useSelector(
    (state) => state.user,
    shallowEqual,
  );
  const [uuid, setUuid] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState('admin');
  const [modalTypeState, setModalTypeState] = useState(modalType.DELETE);
  const immutable = activeMenu.data?.role || role;
  const { user } = useSelector((state) => state.auth, shallowEqual);

  const {
    isDemo,
    demoDeliveryman,
    demoSeller,
    demoAdmin,
    demoModerator,
    demoMeneger,
  } = useDemo();

  const data = activeMenu.data;
  const roleData = { role: immutable };

  const paramsData = {
    sort: data?.sort,
    column: data?.column,
    ...roleData,
    perPage: data?.perPage,
    page: data?.page,
    search: data?.search,
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `user/${row.uuid}`,
        id: 'user_edit',
        name: 'User edit',
      }),
    );
    navigate(`/user/${row.uuid}`);
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        url: `user-clone/${row.uuid}`,
        id: 'user-clone',
        name: 'user.clone',
      }),
    );
    navigate(`/user-clone/${row.uuid}`);
  };

  const goToDetail = (row) => {
    dispatch(
      addMenu({
        url: `/users/user/${row.uuid}`,
        id: 'user_info',
        name: t('user.info'),
      }),
    );
    navigate(`/users/user/${row.uuid}`, { state: { user_id: row.id } });
  };

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('firstname'),
      dataIndex: 'firstname',
      is_show: true,
    },
    {
      title: t('lastname'),
      dataIndex: 'lastname',
      is_show: true,
    },
    {
      title: t('email'),
      dataIndex: 'email',
      is_show: true,
      render: (email) => (ReactAppIsDemo ? hideEmail(email) : email),
    },
    {
      title: t('role'),
      dataIndex: 'role',
      is_show: true,
    },
    {
      title: t('options'),
      dataIndex: 'options',
      is_show: true,
      render: (_, row) => {
        return (
          <Space>
            <Button
              icon={<ExpandOutlined />}
              onClick={() => setUuid(row.uuid)}
            />
            {user.role === 'manager' && row.role === 'admin' ? undefined : (
              <>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => goToDetail(row)}
                />
                <Button
                  type='primary'
                  icon={<EditOutlined />}
                  onClick={() => goToEdit(row)}
                  disabled={
                    /*eslint-disable eqeqeq*/
                    (isDemo && row?.id == demoDeliveryman) ||
                    (isDemo && row?.id == demoModerator) ||
                    (isDemo && row?.id == demoMeneger) ||
                    (isDemo && row?.id == demoSeller) ||
                    (isDemo && row?.id == demoAdmin)
                  }
                />
              </>
            )}

            {row?.role !== 'admin' && (
              <Space>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => goToClone(row)}
                />
                <DeleteButton
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setModalTypeState(modalType.DELETE);
                    setId([row.id]);
                    setIsModalVisible(true);
                    setText(true);
                  }}
                />
              </Space>
            )}
            {row?.role === 'seller' && (
              <Button
                icon={<LoginOutlined />}
                onClick={() => {
                  setModalTypeState(modalType.SELLER_LOGIN);
                  setIsModalVisible(true);
                  setId(row.uuid);
                }}
              />
            )}
          </Space>
        );
      },
    },
  ]);

  const goToAdduser = (e) => {
    dispatch(
      addMenu({
        id: 'user-add-role',
        url: `user/add/${e}`,
        name: t(`add.${e}`),
      }),
    );
    navigate(`/user/add/${e}`);
  };

  function onChangePagination(pagination, filter, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...activeMenu.data, perPage, page, column, sort },
      }),
    );
  }

  const userDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };

    deliveryService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(fetchUsers(paramsData));
        setIsModalVisible(false);
        setText([]);
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
      });
  };

  const loginAsSeller = () => {
    setLoadingBtn(true);
    userService.loginAs(id).then((res) => {
      const user = {
        fullName: res.data.user.firstname + ' ' + res.data.user.lastname,
        role: 'seller',
        urls: menuData.seller,
        img: res.data.user.img,
        token: res.data.access_token,
        email: res.data.user.email,
        id: res.data.user.id,
        shop_id: res.data.user?.shop?.id,
        walledId: res.data?.user?.wallet?.id,
      };

      batch(() => {
        dispatch(clearMenu());
        dispatch(setCurrentChat(null));
        dispatch(setUserData(user));
        dispatch(fetchRestSettings());
      });
      localStorage.setItem('token', res.data.access_token);
      dispatch(fetchMyShop());
    });
    setIsModalVisible(false);
    navigate('/dashboard');
  };

  const fetchAllRoles = () => {
    setTabsLoading(true);
    userService
      .getRoles()
      .then(({ data }) => {
        setRoles(data?.map((role) => role?.name));
      })
      .finally(() => setTabsLoading(false));
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      batch(() => {
        dispatch(fetchUsers(paramsData));
        dispatch(disableRefetch(activeMenu));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    dispatch(fetchUsers(paramsData));
  }, [activeMenu.data]);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      }),
    );
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setModalTypeState(modalType.DELETE);
      setIsModalVisible(true);
      setText(false);
    }
  };

  return (
    <Card
      title={t('users')}
      extra={
        <Space wrap>
          <DeleteButton size='' onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
      loading={tabsLoading}
    >
      <div className='d-flex justify-content-between mb-3'>
        <SearchInput
          placeholder={t('search')}
          className='w-25'
          handleChange={(e) => {
            handleFilter({ search: e });
          }}
          defaultValue={activeMenu.data?.search}
          resetSearch={!activeMenu.data?.search}
        />
      </div>
      <Tabs
        scroll={{ x: true }}
        activeKey={immutable}
        onChange={(key) => {
          handleFilter({ role: key, page: 1 });
          setRole(key);
        }}
        type='card'
      >
        {roles.map((item) => (
          <TabPane tab={t(item)} key={item} />
        ))}
      </Tabs>
      {immutable !== 'admin' && immutable !== 'seller' ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={() => goToAdduser(immutable)}
            className='mr-2'
          >
            {t(`add.${immutable}`)}
          </Button>
        </div>
      ) : null}
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={users}
        loading={loading}
        pagination={{
          pageSize: params.perPage,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
      />

      <CustomModal
        click={
          modalTypeState === modalType.SELLER_LOGIN ? loginAsSeller : userDelete
        }
        text={
          modalTypeState === modalType.SELLER_LOGIN
            ? t('do.you.want.login.as.this.seller')
            : text
            ? t('delete')
            : t('all.delete')
        }
        loading={loadingBtn}
        setText={setId}
      />
      {uuid && <UserShowModal uuid={uuid} handleCancel={() => setUuid(null)} />}
      {userRole && (
        <UserRoleModal data={userRole} handleCancel={() => setUserRole(null)} />
      )}
    </Card>
  );
}
