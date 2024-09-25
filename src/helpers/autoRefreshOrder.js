import { store } from 'redux/store';
import { DEFAULT_ORDER_TIMEOUT } from '../constants';

export default function autoRefreshOrder(cb) {
  const duration = (() => {
    const valueFromSettings = Number(
      store.getState()?.globalSettings?.settings?.order_refresh_timeout,
    );
    const isValidNumber = !isNaN(valueFromSettings);

    if (isValidNumber) {
      if (valueFromSettings === 0) {
        return Infinity;
      } else {
        return valueFromSettings;
      }
    } else {
      return DEFAULT_ORDER_TIMEOUT;
    }
  })();

  return setInterval(
    () => {
      cb();
    },
    Number(duration || 30) * 1000,
  );
}
