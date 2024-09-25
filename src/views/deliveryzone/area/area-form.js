import React, { useState } from 'react';
import { Form, Row, Col, Input, Button, Switch, Modal, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import LanguageList from 'components/language-list';
import { shallowEqual, useSelector, useDispatch, batch } from 'react-redux';
import { toast } from 'react-toastify';
import countryService from 'services/deliveryzone/country';
import { useEffect } from 'react';
import { InfiniteSelect } from 'components/infinite-select';
import cityService from 'services/deliveryzone/city';
import regionService from 'services/deliveryzone/region';
import areaService from 'services/deliveryzone/area';
import { setRefetch } from 'redux/slices/menu';
import { useQueryParams } from 'helpers/useQueryParams';

export default function AreaForm({ visible, setVisible, id, setId }) {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const queryParams = useQueryParams();

  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [loadingBtn, setLoadingBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [hasMore, setHasMore] = useState({
    region: false,
    country: false,
    city: false,
  });

  const selectedRegion = Form.useWatch('region_id', form);
  const selectedCountry = Form.useWatch('country_id', form);

  const handleClose = () => {
    setData(null);
    setVisible(false);
    form.resetFields();
    setId(null);
  };

  const addCountry = (values) => {
    areaService
      .create(values)
      .then(() => {
        toast.success(t('successfully.added'));
        queryParams.reset('search');
        handleClose();
      })
      .finally(() => setLoadingBtn(false));
  };

  const updateCountry = (values) => {
    areaService
      .update(data.id, values)
      .then(() => {
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(setRefetch(activeMenu));
        });
        handleClose();
      })
      .finally(() => setLoadingBtn(false));
  };

  const onFinish = (values) => {
    setLoadingBtn(true);
    const paramsData = {
      country_id: values?.country_id?.value,
      region_id: values?.region_id?.value,
      city_id: values?.city_id?.value,
      active: values.active,
      title: {
        ...Object.assign(
          {},
          ...languages.map((lang) => ({
            [lang.locale]: values[`title[${lang.locale}]`],
          })),
        ),
      },
    };
    if (data?.id) updateCountry(paramsData);
    else addCountry(paramsData);
  };

  function getLanguageFields(data) {
    if (!data?.translations) {
      return {};
    }
    const { translations } = data;
    const result = languages.map((item) => ({
      [`title[${item?.locale}]`]: translations.find(
        (el) => el?.locale === item?.locale,
      )?.title,
    }));
    return Object.assign({}, ...result);
  }

  const fetchRegion = ({ search, page }) => {
    const params = {
      search: search?.length ? search : undefined,
      page,
    };
    return regionService.get(params).then((res) => {
      setHasMore({
        ...hasMore,
        region: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res.data.map((region) => ({
        label: region?.translation?.title,
        value: region?.id,
      }));
    });
  };

  const fetchCountry = ({ search, page }) => {
    const params = {
      search: search?.length ? search : undefined,
      region_id: selectedRegion?.value || undefined,
      page,
    };
    return countryService.get(params).then((res) => {
      setHasMore({
        ...hasMore,
        country: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res.data.map((country) => ({
        label: country?.translation?.title,
        value: country?.id,
      }));
    });
  };

  const fetchCity = ({ search, page }) => {
    const params = {
      search: search?.length ? search : undefined,
      country_id: selectedCountry?.value || undefined,
      page,
    };
    return cityService.get(params).then((res) => {
      setHasMore({
        ...hasMore,
        city: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res.data.map((city) => ({
        label: city?.translation?.title,
        value: city?.id,
      }));
    });
  };
  useEffect(() => {
    if (id) {
      setLoading(true);
      areaService
        .show(id)
        .then(({ data }) => {
          setData(data);
          form.setFieldsValue({
            active: data?.active,
            country_id: {
              label: data?.country?.translation?.title,
              value: data?.country?.id,
            },
            region_id: {
              label: data?.region?.translation?.title,
              value: data?.region?.id,
            },
            city_id: {
              label: data?.city?.translation?.title,
              value: data?.city?.id,
            },
            ...getLanguageFields(data),
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      onOk={handleClose}
      footer={null}
      loading={loading}
      title={t('add.area')}
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout='vertical'
        initialValues={{ active: true }}
      >
        <Spin spinning={loading}>
          <Row gutter={24}>
            <Col span={24}>
              <LanguageList />
            </Col>
            <Col span={24}>
              {languages.map((item) => (
                <Form.Item
                  key={'title' + item.id}
                  label={t('title')}
                  name={`title[${item.locale}]`}
                  hidden={item.locale !== defaultLang}
                  rules={[
                    {
                      required: item?.locale === defaultLang,
                      message: t('required'),
                    },
                    {
                      type: 'string',
                      min: 2,
                      max: 200,
                      message: t('min.2.max.200.chars'),
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              ))}
            </Col>
            <Col span={24}>
              <Form.Item
                name='region_id'
                label={t('region.id')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InfiniteSelect
                  fetchOptions={fetchRegion}
                  hasMore={hasMore.region}
                  onClear={() =>
                    form.setFieldsValue({
                      country_id: undefined,
                      city_id: undefined,
                    })
                  }
                  onSelect={() =>
                    form.setFieldsValue({
                      country_id: undefined,
                      city_id: undefined,
                    })
                  }
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='country_id'
                label={t('country.id')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InfiniteSelect
                  fetchOptions={fetchCountry}
                  disabled={!selectedRegion}
                  hasMore={hasMore.country}
                  onClear={() => form.setFieldsValue({ city_id: undefined })}
                  onSelect={() => form.setFieldsValue({ city_id: undefined })}
                  refetchOnFocus={true}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name='city_id'
                label={t('city.id')}
                rules={[{ required: true, message: t('required') }]}
              >
                <InfiniteSelect
                  fetchOptions={fetchCity}
                  disabled={!selectedCountry}
                  hasMore={hasMore.city}
                  refetchOnFocus={true}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                label={t('active')}
                name='active'
                valuePropName='checked'
              >
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Spin>
        <Button type='primary' htmlType='submit' loading={loadingBtn}>
          {t('submit')}
        </Button>
      </Form>
    </Modal>
  );
}
