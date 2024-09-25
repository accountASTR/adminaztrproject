import { Button, Form, Space } from 'antd';
import { InfiniteSelect } from 'components/infinite-select';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import addressService from 'services/rest/address';

const LocationSelect = ({ onClose, onSubmit, isButtonLoading }) => {
  const { t } = useTranslation();
  const [links, setLinks] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const fetchCountries = ({ search, page }) => {
    return addressService
      .getCountries({ search, page, has_price: true })
      .then((res) => {
        setLinks(res.links);
        return res.data.map((country) => ({
          label: country?.translation?.title,
          value: `${country.id},${country.region_id}`,
        }));
      });
  };

  const fetchCities = ({ search, page }) => {
    return addressService
      .getCities({
        search,
        page,
        country_id: selectedCountry.value,
        has_price: true,
      })
      .then((res) => {
        setLinks(res.links);
        const cities = [];
        if (res.meta.current_page === 1) {
          cities.push({
            label: t('whole.country'),
            value: 'all',
          });
        }
        res.data.forEach((country) => {
          cities.push({
            label: country?.translation?.title,
            value: country.id,
          });
        });
        return cities;
      });
  };

  return (
    <Form layout='vertical' onFinish={onSubmit}>
      <Form.Item
        name='country'
        label={t('country')}
        rules={[{ required: true, message: t('required') }]}
      >
        <InfiniteSelect
          hasMore={links?.next}
          fetchOptions={fetchCountries}
          onChange={(value) => setSelectedCountry(value)}
        />
      </Form.Item>
      {selectedCountry && (
        <>
          <Form.Item
            rules={[{ required: true, message: t('required') }]}
            name='city'
            label={t('city')}
          >
            <InfiniteSelect hasMore={links?.next} fetchOptions={fetchCities} />
          </Form.Item>
        </>
      )}
      <Space className='justify-content-end w-100'>
        <Button onClick={onClose} htmlType='button'>
          {t('cancel')}
        </Button>
        <Button loading={isButtonLoading} htmlType='submit' type='primary'>
          {t('add')}
        </Button>
      </Space>
    </Form>
  );
};

export default LocationSelect;
