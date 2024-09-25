import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Space, Switch, Table } from 'antd';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setRefetch } from 'redux/slices/menu';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { fetchCountry } from 'redux/slices/deliveryzone/country';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import countryService from 'services/deliveryzone/country';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQueryParams } from 'helpers/useQueryParams';
import CountryForm from './country-form';

const Country = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const queryParams = useQueryParams();

  const { setIsModalVisible } = useContext(Context);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const {
    list,
    meta,
    loading,
    params: initialParams,
  } = useSelector((state) => state.deliveryCountries, shallowEqual);

  const [selectedId, setSelectedId] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [id, setId] = useState(null);

  const params = {
    ...initialParams,
    search: queryParams.get('search') || undefined,
    region_id: queryParams.get('region_id') || undefined,
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: t('name'),
      dataIndex: 'translation',
      key: 'translation',
      render: (translation) => translation?.title || '-',
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      render: (active, row) => {
        return (
          <Switch
            key={row.id}
            onChange={() => handleActive(row.id)}
            checked={active}
            loading={Boolean(selectedId === row.id)}
          />
        );
      },
    },
    {
      title: t('options'),
      dataIndex: 'options',
      is_show: true,
      render: (_, row) => {
        return (
          <Space>
            <Button
              type='primary'
              icon={<EditOutlined />}
              onClick={() => handleEdit(row.id)}
            />
            <Button
              loading={Boolean(deleting === row.id)}
              icon={<DeleteOutlined onClick={() => handleDelete(row.id)} />}
            />
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    const paramsData = {
      ...params,
      page: 1,
    };
    fetch(paramsData);
  }, [params.search, params.region_id]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch(params);
    }
  }, [activeMenu.refetch]);

  const fetch = (params = {}) => {
    dispatch(fetchCountry(params));
    dispatch(disableRefetch(activeMenu));
  };

  const handleActive = (id) => {
    setSelectedId(id);
    countryService
      .status(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setSelectedId(null);
      });
  };

  const handleDelete = (id) => {
    setDeleting(id);
    countryService
      .delete(id)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.deleted'));
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  const handleEdit = (id) => {
    setVisible(true);
    setId(id);
  };

  const onChangePagination = (pageNumber) => {
    const { pageSize, current } = pageNumber;
    const paramsData = {
      ...params,
      perPage: pageSize,
      page: current,
    };
    fetch(paramsData);
  };

  const handleFilter = (key, value) => {
    if (key === 'search') {
      if (value?.length) {
        queryParams.set(key, value);
      } else {
        queryParams.reset(key);
      }
    }
  };

  return (
    <Card
      title={t('countries')}
      extra={
        <Space>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFilter('search', search)}
            defaultValue={queryParams.get('search')}
            resetSearch={!queryParams.get('search')}
          />
          <Button type='primary' onClick={() => setVisible(true)}>
            {t('add.country')}
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={list}
        pagination={{
          pageSize: meta.per_page || 10,
          page: meta.current_page ?? 1,
          total: meta.total ?? 0,
          current: meta?.current_page ?? 1,
        }}
        rowKey={(record) => record.id}
        loading={loading}
        onChange={onChangePagination}
      />

      <CountryForm
        visible={visible}
        setVisible={setVisible}
        id={id}
        setId={setId}
      />
    </Card>
  );
};

export default Country;
