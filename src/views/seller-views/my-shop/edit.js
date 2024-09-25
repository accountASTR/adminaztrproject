import React, { useEffect, useState } from 'react';
import { Card, Steps } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import LanguageList from 'components/language-list';
import shopService from 'services/seller/shop';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from 'helpers/useQueryParams';
import ShopMain from './main';
import Delivery from './shopDelivery';
import Loading from 'components/loading';
import ShopLocations from 'components/shop/seller-shop-locations';
import ShopSocial from './social';

const { Step } = Steps;

export const steps = [
  {
    title: 'shop',
    content: 'First-content',
  },
  {
    title: 'shop.locations',
    content: 'Second-content',
  },
  {
    title: 'social',
    content: 'Third-content',
  },
  {
    title: 'delivery',
    content: 'Fourth-content',
  },
];

export default function MyShopEdit() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const queryParams = useQueryParams();
  const current = Number(queryParams.values?.step || 0);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [loading, setLoading] = useState(false);

  const fetchShop = () => {
    setLoading(true);
    shopService
      .get()
      .then((res) => {
        const data = {
          ...res.data,
          ...getLanguageFields(res.data),
          logo_img: createImages(res.data?.logo_img),
          background_img: createImages(res.data?.background_img),
          user: {
            label: `${res.data.seller.firstname || ''} ${
              res.data?.seller?.lastname || ''
            }`,
            value: res.data?.seller?.id,
          },
          delivery_time_from: res.data?.delivery_time.from || 0,
          delivery_time_to: res.data?.delivery_time.to || 0,
          delivery_time_type: res.data?.delivery_time.type,

          categories: res.data?.categories?.map((item) => ({
            label: item?.translation?.title,
            value: item.id,
            key: item.id,
          })),
          tags: res.data?.tags?.map((item) => ({
            label: item?.translation?.title,
            value: item.id,
            key: item.id,
          })),
          price: res.data?.price || 0,
          price_per_km: res.data?.price_per_km || 0,
          min_amount: res.data?.min_amount || 0,
          tax: res.data?.tax || 0,
          percentage: res.data?.percentage || 0,
          emailStatuses: res?.data?.email_statuses?.map((item) => ({
            label: t(item),
            value: item,
            key: item,
          })),
        };
        dispatch(setMenuData({ activeMenu, data }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const createImages = (items) => {
    return {
      items,
      uid: items,
      url: items,
      name: items,
    };
  };

  function getLanguageFields(data) {
    if (!data?.translations) {
      return {};
    }
    const { translations } = data;
    const result = languages.map((item) => ({
      [`title[${item.locale}]`]: translations.find(
        (el) => el.locale === item.locale,
      )?.title,
      [`description[${item.locale}]`]: translations.find(
        (el) => el.locale === item.locale,
      )?.description,
      [`address[${item.locale}]`]: translations.find(
        (el) => el.locale === item.locale,
      )?.address,
    }));
    return Object.assign({}, ...result);
  }

  useEffect(() => {
    if (activeMenu.refetch || queryParams.values?.step) {
      fetchShop();
    }
  }, [activeMenu.refetch, queryParams.values?.step]);

  const next = () => {
    const step = current + 1;
    queryParams.set('step', step);
  };
  const prev = () => {
    const step = current - 1;
    queryParams.set('step', step);
  };

  const onChange = (step) => {
    dispatch(setMenuData({ activeMenu, data: { ...activeMenu.data, step } }));
    queryParams.set('step', step);
  };

  return (
    <Card title={t('shop.edit')} extra={<LanguageList />}>
      <Steps current={current} onChange={onChange}>
        {steps.map((item) => (
          <Step title={t(item.title)} key={item.title} />
        ))}
      </Steps>
      {!loading ? (
        <div className='steps-content'>
          {steps[current].content === 'First-content' && (
            <ShopMain next={next} loading={loading} />
          )}

          {steps[current].content === 'Second-content' && (
            <ShopLocations prev={prev} next={next} />
          )}

          {steps[current].content === 'Third-content' && (
            <ShopSocial prev={prev} next={next} />
          )}

          {steps[current].content === 'Fourth-content' && (
            <Delivery prev={prev} />
          )}
        </div>
      ) : (
        <Loading />
      )}
    </Card>
  );
}
