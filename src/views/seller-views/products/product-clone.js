import React, { useEffect, useState } from 'react';
import { steps } from './steps';
import { Card, Spin, Steps } from 'antd';
import ProductProperty from './product-property';
import ProductFinish from './product-finish';
import ProductStock from 'components/forms/product/stock';
import ProductExtras from './product-extras';
import ProductsIndex from './products-index';
import LanguageList from 'components/language-list';
import { useParams } from 'react-router-dom';
import productService from 'services/seller/product';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData, removeFromMenu } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from 'helpers/useQueryParams';

const { Step } = Steps;

const SellerProductsClone = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const queryParams = useQueryParams();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);
  const dispatch = useDispatch();

  const current = Number(queryParams.values?.step || 0);
  const [loading, setLoading] = useState(activeMenu.refetch);
  const next = () => {
    const step = current + 1;
    queryParams.set('step', step);
  };
  const prev = () => {
    const step = current - 1;
    queryParams.set('step', step);
  };

  const createImages = (items) =>
    items.map((item) => ({
      uid: item.id,
      name: item.path,
      url: item.path,
    }));

  const createSelectObject = (item) => {
    if (!item) return null;
    return {
      label: item.translation ? item.translation.title : item.title,
      value: item.id,
    };
  };

  const createMediaFile = (items) => {
    const mediaObject = { images: [], previews: [] };
    const previews = items
      .filter((item) => item.preview)
      .map((item) => ({
        uid: item.id,
        name: item.preview,
        url: item.preview,
      }));
    const videos = items
      .filter((item) => item.preview)
      .map((item) => ({
        uid: item.id,
        name: item.path,
        url: item.path,
        isVideo: true,
      }));
    mediaObject.previews = previews;
    mediaObject.images = videos;

    return mediaObject;
  };

  function fetchProduct(uuid) {
    setLoading(true);
    productService
      .getById(uuid)
      .then((res) => {
        const extras = {};
        res?.data?.stocks.forEach((stock) => {
          stock.extras?.forEach((extra) => {
            if (extra?.extra_group_id in extras) {
              if (
                !extras[extra?.extra_group_id]?.values?.some(
                  (item) => item.value === extra?.value?.id,
                )
              ) {
                extras[extra?.extra_group_id].values?.push({
                  value: extra?.value?.id,
                  label: extra?.value?.value,
                  stock_id: stock?.id,
                });
              }
            } else {
              extras[extra?.extra_group_id] = {
                group: extra?.group,
                label: extra?.group?.translation?.title,
                value: extra?.extra_group_id,
                id: extra?.extra_group_id,
                stock_id: stock.id,
                values: [
                  {
                    value: extra?.value.id,
                    label: extra?.value?.value,
                    stock_id: stock.id,
                  },
                ],
              };
            }
          });
        });
        const data = {
          ...res?.data,
          ...getLanguageFields(res?.data),
          shop: createSelectObject(res?.data?.shop),
          category: createSelectObject(res?.data?.category),
          brand: createSelectObject(res?.data?.brand),
          unit: createSelectObject(res?.data?.unit),
          images: createImages(res?.data?.galleries),
          initialMediaFile: createMediaFile(res?.data?.galleries),
          extras: Object.values(extras),
          stocks: res?.data?.stocks.map((stock) => ({
            ...stock,
            ...Object.assign(
              {},
              ...stock.extras.map((extra, idx) => ({
                [`extras[${idx}]`]: extra?.id,
              })),
            ),
            quantity: stock.quantity || 0,
            price: stock.price || 0,
            extras: undefined,
          })),
          stocksData: res?.data?.stocks,
          properties: res?.data?.properties?.map((item, index) => ({
            id: index,
            [`key[${item.locale}]`]: item.key,
            [`value[${item.locale}]`]: item.value,
          })),
          translation: undefined,
          translations: undefined,
        };
        dispatch(setMenuData({ activeMenu, data }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  }

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
    }));
    return Object.assign({}, ...result);
  }

  useEffect(() => {
    if (activeMenu.refetch) {
      fetchProduct(uuid);
    }
  }, [activeMenu.refetch]);

  const onChange = (step) => {
    dispatch(setMenuData({ activeMenu, data: { ...activeMenu.data, step } }));
    queryParams.set('step', step);
  };

  useEffect(() => {
    return () => {
      const nextUrl = 'seller/products';
      dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
    };
  }, []);

  return (
    <>
      <Card title={t('clone.product')} extra={<LanguageList />}>
        <Steps current={current} onChange={onChange}>
          {steps.map((item) => (
            <Step title={t(item.title)} key={item.title} />
          ))}
        </Steps>
      </Card>
      {!loading ? (
        <div className=''>
          {steps[current].content === 'First-content' && (
            <ProductsIndex next={next} action_type={'clone'} />
          )}

          {steps[current].content === 'Second-content' && (
            <ProductExtras next={next} prev={prev} />
          )}

          {steps[current].content === 'Third-content' && (
            <ProductStock next={next} prev={prev} userRole='seller' />
          )}

          {steps[current].content === 'Fourth-content' && (
            <ProductProperty next={next} prev={prev} />
          )}

          {steps[current].content === 'Finish-content' && (
            <ProductFinish prev={prev} />
          )}
        </div>
      ) : (
        <div className='d-flex justify-content-center align-items-center'>
          <Spin size='large' className='py-5' />
        </div>
      )}
    </>
  );
};
export default SellerProductsClone;
