import React, { useState } from 'react';
import { Card, Col, Row } from 'antd';
import { DebounceSelect } from 'components/search';
import categoryService from 'services/rest/category';
import useDidUpdate from 'helpers/useDidUpdate';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchRestProducts } from 'redux/slices/product';
import SearchInput from 'components/search-input';
import { useTranslation } from 'react-i18next';

const Filter = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState(null);
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);

  async function fetchUserCategory(search) {
    const params = {
      search,
      type: 'main',
    };

    if (!search) delete params?.search;

    return categoryService.search(params).then((res) =>
      res.data.map((item) => ({
        label: !!item?.translation?.title ? item?.translation?.title : t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  }

  useDidUpdate(() => {
    const params = {
      brand_id: brand?.value,
      category_id: category?.value,
      search,
      active: 1,
      status: 'published',
      shop_id: myShop?.id,
    };
    dispatch(fetchRestProducts(params));
  }, [brand, category, search]);

  return (
    <Card>
      <Row gutter={12}>
        <Col span={12}>
          <SearchInput
            className='w-100'
            placeholder={t('search')}
            handleChange={setSearch}
          />
        </Col>
        <Col span={myShop.type === 'shop' ? 6 : 12}>
          <DebounceSelect
            className='w-100'
            placeholder={t('select.category')}
            fetchOptions={fetchUserCategory}
            onChange={(value) => setCategory(value)}
            value={category}
          />
        </Col>
      </Row>
    </Card>
  );
};
export default Filter;
