import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import deliveryPriceService from 'services/delivery-price';
import { fetchDeliveryPrice } from 'redux/slices/delivery-price';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import formatSortType from 'helpers/formatSortType';
import numberToPrice from 'helpers/numberToPrice';
import shopService from '../../services/restaurant';
import { DebounceSelect } from '../../components/search';
import regionService from '../../services/deliveryzone/region';
import areaService from '../../services/deliveryzone/area';
import cityService from '../../services/deliveryzone/city';
import SearchInput from '../../components/search-input';

const DeliveryPrice = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setIsModalVisible } = useContext(Context);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { deliveryPrice, meta, loading, params } = useSelector(
    (state) => state.deliveryPrice,
    shallowEqual,
  );
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );
  const [id, setId] = useState(null);
  const data = activeMenu.data;
  const paramsData = {
    perPage: data?.perPage,
    page: data?.page,
    shop_id: data?.shop?.value,
    area_id: data?.area?.value,
    region_id: data?.region?.value,
    city_id: data?.city?.value,
    search: data?.search,
  };
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('shop'),
      dataIndex: 'shop',
      key: 'shop',
      is_show: true,
      render: (shop) => shop?.translation?.title ?? '--',
    },
    {
      title: t('country'),
      dataIndex: 'country',
      key: 'country',
      is_show: true,
      render: (country) => country?.translation?.title ?? '--',
    },
    {
      title: t('region'),
      dataIndex: 'region',
      key: 'region',
      is_show: true,
      render: (region) => region?.translation?.title ?? '--',
    },
    {
      title: t('city'),
      dataIndex: 'city',
      key: 'city',
      is_show: true,
      render: (city) => city?.translation?.title ?? '--',
    },
    {
      title: t('area'),
      dataIndex: 'area',
      key: 'area',
      is_show: true,
      render: (area) => area?.translation?.title ?? '--',
    },
    {
      title: t('price'),
      dataIndex: 'price',
      key: 'price',
      is_show: true,
      render: (price) =>
        numberToPrice(
          price,
          defaultCurrency?.symbol,
          defaultCurrency?.position,
        ),
    },
    {
      title: t('options'),
      key: 'options',
      dataIndex: 'options',
      is_show: true,
      render: (_, row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([row.id]);
            }}
          />
        </Space>
      ),
    },
  ]);

  const goToAdd = () => {
    dispatch(
      addMenu({
        id: 'delivery-price/add',
        url: 'delivery-price/add',
        name: t('add.delivery.price'),
      }),
    );
    navigate('/delivery-price/add');
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `delivery-price/${row.id}`,
        id: 'price.edit',
        name: t('edit.delivery.price'),
      }),
    );
    navigate(`/delivery-price/${row.id}`);
  };

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      }),
    );
  };

  async function fetchShops(search) {
    const params = {
      search: search.length === 0 ? null : search,
    };
    return shopService.search(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title,
        value: item.id,
      })),
    );
  }

  async function fetchAreas(search) {
    const params = {
      search: search.length === 0 ? null : search,
    };
    return areaService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title,
        value: item.id,
      })),
    );
  }

  async function fetchRegions(search) {
    const params = {
      search: search.length === 0 ? null : search,
    };
    return regionService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title,
        value: item.id,
      })),
    );
  }

  async function fetchCities(search) {
    const params = {
      search: search.length === 0 ? null : search,
    };
    return cityService.get(params).then(({ data }) =>
      data.map((item) => ({
        label: item.translation?.title,
        value: item.id,
      })),
    );
  }

  const deleteDeliveryPrice = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    deliveryPriceService
      .delete(params)
      .then(() => {
        dispatch(fetchDeliveryPrice({}));
        toast.success(t('successfully.deleted'));
        setIsModalVisible(false);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  useDidUpdate(() => {
    dispatch(fetchDeliveryPrice(paramsData));
  }, [activeMenu.data]);

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchDeliveryPrice(paramsData));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

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
      setIsModalVisible(true);
    }
  };

  return (
    <Card
      title={t('delivery.price')}
      extra={
        <Space wrap>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={goToAdd}
          >
            {t('add.delivery.price')}
          </Button>
          <DeleteButton size='' onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns setColumns={setColumns} columns={columns} />
        </Space>
      }
    >
      <div className='my-2'>
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            className='w-25'
            handleChange={(e) => {
              handleFilter({ search: e });
            }}
            defaultValue={activeMenu.data?.search}
            resetSearch={!activeMenu.data?.search}
            style={{ minWidth: 300 }}
          />
          <DebounceSelect
            placeholder={t('select.shop')}
            fetchOptions={fetchShops}
            style={{ minWidth: 180 }}
            onChange={(e) => handleFilter({ shop: e })}
            value={activeMenu.data?.shop}
          />
          <DebounceSelect
            placeholder={t('select.area')}
            fetchOptions={fetchAreas}
            style={{ minWidth: 180 }}
            onChange={(e) => handleFilter({ area: e })}
            value={activeMenu.data?.area}
          />
          <DebounceSelect
            placeholder={t('select.region')}
            fetchOptions={fetchRegions}
            style={{ minWidth: 180 }}
            onChange={(e) => handleFilter({ region: e })}
            value={activeMenu.data?.region}
          />
          <DebounceSelect
            placeholder={t('select.city')}
            fetchOptions={fetchCities}
            style={{ minWidth: 180 }}
            onChange={(e) => handleFilter({ city: e })}
            value={activeMenu.data?.city}
          />
        </Space>
      </div>
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={deliveryPrice}
        pagination={{
          pageSize: params.perPage,
          page: activeMenu.data?.page || 1,
          total: meta.total,
          defaultCurrent: activeMenu.data?.page,
          current: activeMenu.data?.page,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />
      <CustomModal
        click={deleteDeliveryPrice}
        text={t('delete')}
        loading={loadingBtn}
        setText={setId}
      />
    </Card>
  );
};

export default DeliveryPrice;
