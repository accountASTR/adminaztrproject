import { Button, Card, Collapse, Form, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import productService from 'services/product';
import sellerProductService from 'services/seller/product';
import cartesian from 'helpers/cartesian';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setActiveMenu, setMenuData } from 'redux/slices/menu';
import useDidUpdate from 'helpers/useDidUpdate';
import {
  resetDeletedIds,
  resetFilteredStocks,
  resetFilters,
  resetFormStocks,
  setFormStocks,
} from 'redux/slices/product';
import { useTranslation } from 'react-i18next';
import RiveResult from 'components/rive-result';
import { getUpdatedStocks } from 'helpers/product-stock';
import { toast } from 'react-toastify';
import SetAll from './set-all';
import ProductStockList from './list';
import ProductStockFilter from './filter';

const localProductService = (userRole) => {
  switch (userRole) {
    case 'seller':
      return sellerProductService;
    default:
      return productService;
  }
};

const StockForm = ({ next, prev, isRequest, userRole = 'admin' }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { uuid } = useParams();
  const [form] = Form.useForm();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { stocks, filteredStocks, filters, deletedIds } = useSelector(
    (state) => state.product.form,
    shallowEqual,
  );

  const [loading, setLoading] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const fetchProduct = () => {
    // return;
    setLoading(true);
    localProductService(userRole)
      .getById(uuid)
      .then((res) => {
        const additionalStocks = activeMenu?.data?.extras
          ? cartesian(
              activeMenu?.data?.extras?.map((extra) => extra?.values || []),
            )
          : [];

        const parsedAdditionalStocks = additionalStocks.map(
          (additionalStock, i) => {
            if (
              additionalStock.every(
                (itemValue) => typeof itemValue.stock_id !== 'undefined',
              )
            ) {
              const selectedStock = res.data.stocks.find((stock) => {
                return stock.extras.every((extra) => {
                  return additionalStock.some(
                    (addStock) => addStock.value === extra?.value?.id,
                  );
                });
              });
              return {
                price: selectedStock?.price || 0,
                quantity: selectedStock?.quantity || 0,
                sku: selectedStock?.sku,
                stock_id: selectedStock?.id,
                tax: activeMenu?.data.tax || 0,
                extras: additionalStock,
                fieldKey: i,
                ...Object.assign(
                  {},
                  ...additionalStock.map((extra, idx) => ({
                    [`extras[${idx}]`]: {
                      label: extra.label,
                      value: extra.value,
                    },
                  })),
                ),
              };
            }

            return {
              price: 0,
              quantity: 0,
              sku: activeMenu?.data?.sku,
              tax: activeMenu.data?.tax || 0,
              extras: additionalStock,
              fieldKey: i,
              ...Object.assign(
                {},
                ...additionalStock.map((extra, idx) => ({
                  [`extras[${idx}]`]: {
                    label: extra.label,
                    value: extra.value,
                  },
                })),
              ),
            };
          },
        );
        let defaultStock = [];
        if (additionalStocks.length === 0 && res.data.stocks?.length !== 0) {
          const stockWithoutExtras = res.data.stocks?.at(0);
          defaultStock = [
            {
              price: stockWithoutExtras?.price || 0,
              quantity: stockWithoutExtras?.quantity || 0,
              sku: stockWithoutExtras?.sku,
              tax: activeMenu.data?.tax || 0,
            },
          ];
        }
        if (additionalStocks.length === 0 && res.data.stocks?.length === 0) {
          defaultStock = [
            {
              price: undefined,
              quantity: 0,
              sku: activeMenu?.data?.sku,
              tax: activeMenu.data?.tax || 0,
            },
          ];
        }
        const stocks = defaultStock.concat(parsedAdditionalStocks);
        batch(() => {
          dispatch(setFormStocks(stocks));
          dispatch(resetDeletedIds());
          dispatch(resetFilters());
          dispatch(resetFilteredStocks());
        });
        form.setFieldsValue({
          stocks,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onFinish = (values) => {
    const { stocks: formStocks } = values;
    const actualStock = getUpdatedStocks(formStocks, stocks, deletedIds);

    let extras;
    if (activeMenu.data?.extras?.length) {
      extras = actualStock.map((item) => ({
        price: item?.price,
        quantity: item?.quantity,
        sku: item?.sku,
        ids: isRequest
          ? activeMenu.data?.extras.map((_, idx) => item[`extras[${idx}]`])
          : activeMenu.data?.extras.map(
              (_, idx) => item?.[`extras[${idx}]`]?.value,
            ),
        stock_id: item?.stock_id,
      }));
    } else {
      extras = [
        {
          price: actualStock?.[0]?.price,
          quantity: actualStock?.[0]?.quantity,
          stock_id: actualStock?.[0]?.stock_id,
          sku: actualStock?.[0]?.sku,
          ids: [],
        },
      ];
    }
    if (isRequest) {
      dispatch(
        setMenuData({
          activeMenu,
          data: { ...activeMenu.data, stocks: extras, delete_ids: deletedIds },
        }),
      );
      next();
      return;
    }
    setLoadingBtn(true);
    localProductService(userRole)
      .stocks(uuid, { extras, delete_ids: deletedIds })
      .then((res) => {
        const localStocks = res?.data?.stocks;
        const newExtras = localStocks?.flatMap((item) => item.extras);
        const extraValues = newExtras.map((item) => ({
          ...item?.value,
          stock_id: item?.stock_id,
          group_type: item?.group?.type,
        }));
        const extraGroup = newExtras?.find(
          (item) => item.group.type === 'color',
        );
        // dispatch(
        //   setMenuData({
        //     activeMenu,
        //     data: {
        //       ...activeMenu.data,
        //       newExtras: [{ group: extraGroup?.group, values: extraValues }],
        //       stocks: extras,
        //       delete_ids: deletedIds,
        //     },
        //   }),
        // );
        // dispatch(setRefetch(activeMenu));
        dispatch(
          setActiveMenu({
            ...activeMenu,
            data: {
              ...activeMenu.data,
              newExtras: [{ group: extraGroup?.group, values: extraValues }],
              stocks: extras,
              delete_ids: deletedIds,
            },
            refetch: true,
          }),
        );
        batch(() => {
          dispatch(resetFilters());
          dispatch(resetFilteredStocks());
          dispatch(resetFormStocks());
          dispatch(resetDeletedIds());
        });
        toast.success(t('successfully.updated'));
        next();
      })
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    fetchProduct();
    dispatch(disableRefetch(activeMenu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetchProduct();
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  return (
    <Form onFinish={onFinish} form={form} layout='vertical'>
      {!!activeMenu.data?.extras?.length && (
        <Card>
          <SetAll form={form} />
        </Card>
      )}
      {!!activeMenu.data?.extras?.length && (
        <ProductStockFilter extras={activeMenu.data?.extras} form={form} />
      )}
      <Card loading={loading}>
        <Collapse defaultActiveKey={['stocks']}>
          <Collapse.Panel key='stocks' header={t('stocks')}>
            {!Object.values(filters)?.length || !!filteredStocks?.length ? (
              <ProductStockList form={form} />
            ) : (
              <RiveResult />
            )}
          </Collapse.Panel>
        </Collapse>
      </Card>
      <Card>
        <Space>
          <Button onClick={prev}>{t('prev')}</Button>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('next')}
          </Button>
        </Space>
      </Card>
    </Form>
  );
};

export default StockForm;
