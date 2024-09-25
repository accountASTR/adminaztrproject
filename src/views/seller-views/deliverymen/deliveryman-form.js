import { useState } from 'react';
import { Form, Row, Col, Input, Button, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { DebounceSelect } from 'components/search';
import addressService from 'services/rest/address';
import MediaUpload from 'components/upload';
import Map from 'components/map';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { shallowEqual, useSelector } from 'react-redux';

const type_of_technique = [
  { label: 'Benzine', value: 'benzine' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Gas', value: 'gas' },
  { label: 'Motorbike', value: 'motorbike' },
  { label: 'Bike', value: 'bike' },
  { label: 'Foot', value: 'foot' },
  { label: 'Electric', value: 'electric' },
];

const DeliverymanForm = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const [country, setCountry] = useState(form.getFieldsValue()?.country);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [image, setImage] = useState([]);
  const [location, setLocation] = useState(getDefaultLocation(settings));

  const fetchCountries = (search) => {
    const params = {
      search,
      perPage: 10,
      page: 1,
      has_price: 1,
    };

    if (!search?.trim()?.length) delete params.search;

    return addressService.getCountries(params).then(({ data }) =>
      data?.flatMap((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.region_id,
      })),
    );
  };

  const fetchCities = (search) => {
    const params = {
      search,
      perPage: 10,
      page: 1,
      country_id: form.getFieldsValue()?.country?.value,
      has_price: 1,
    };

    if (!search?.trim()?.length) delete params.search;

    return addressService.getCities(params).then(({ data }) =>
      data?.flatMap((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const onFinish = (values) => {
    const body = {
      ...values,
      country_id: values?.country?.value,
      city_id: values?.city?.value,
      images: !!image?.length ? image?.map((item) => item?.name) : undefined,
      location: {
        latitude: location.lat,
        longitude: location.lng,
      },
    };

    delete body.country;
    delete body.city;
  };

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={onFinish}
      initialValues={{ online: false }}
    >
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label={t('brand')}
            name='brand'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('model')}
            name='model'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('type.of.technique')}
            name='type_of_technique'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Select options={type_of_technique} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('car.number')}
            name='number'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('car.color')}
            name='color'
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='country'
            label={t('country')}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <DebounceSelect
              fetchOptions={fetchCountries}
              placeholder={t('select.country')}
              onChange={(value) => {
                form.setFieldsValue({ city: [] });
                setCountry(value);
              }}
              onClear={() => {
                form.setFieldsValue({ city: [] });
                setCountry(null);
              }}
              autocomplete='none'
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='city'
            label={t('city')}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <DebounceSelect
              fetchOptions={fetchCities}
              placeholder={t('select.city')}
              refetchOptions={true}
              disabled={!country}
              autocomplete='none'
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('image')}
            name='images'
            rules={[
              {
                required: !image?.length,
                message: t('required'),
              },
            ]}
          >
            <MediaUpload
              type='deliveryman/settings'
              imageList={image}
              setImageList={setImage}
              form={form}
              multiple={true}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label={t('online')} name='online' valuePropName='checked'>
            <Switch />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label={t('map')} name='location'>
            <Map location={location} setLocation={setLocation} />
          </Form.Item>
        </Col>
      </Row>
      <Button type='primary' htmlType='submit' loading={loadingBtn}>
        {t('submit')}
      </Button>
    </Form>
  );
};

export default DeliverymanForm;
