interface StateMachineKey {
  [key: string]: string | number | boolean | Array<string | number | boolean>;
}

export class StateMachine {
  _status: Map<any, any>;
  constructor(data: Array<[StateMachineKey, string | string[]]>) {
      this._status = new Map(data);
  }
  // 判断对象值是否相等(限一层对象)
  static objectValueEqual(baseConfig, baseObj) {
      let isEqual = true;
      for (const key in baseConfig) {
          if (Object.hasOwnProperty.call(baseObj, key)) {
              if (Array.isArray(baseObj[key])) {
                  if (!baseObj[key].includes(baseConfig[key])) {
                      isEqual = false;
                  }
              } else {
                  if (baseObj[key] != baseConfig[key]) {
                      isEqual = false;
                  }
              }
          }
      }
      return isEqual;
  }
  // 是否满足条件判定
  static meet({ baseConfig, arrConfig, baseObj, arrObj }) {
      const statusArr: boolean[] = [];
      for (const key in arrConfig) {
          if (arrConfig.hasOwnProperty(key)) {
              if (Array.isArray(arrObj[key])) {
                  statusArr.push(arrConfig[key].some((e) => arrObj[key].includes(e)));
              } else {
                  statusArr.push(arrConfig[key].indexOf(arrObj[key]) > -1);
              }
          }
      }
      // const equal = JSON.stringify(baseConfig) === JSON.stringify(baseObj);
      return statusArr.every((item) => item) && StateMachine.objectValueEqual(baseConfig, baseObj);
  }
  // 条件拆分
  static filter(config, data) {
      const arrConfig: StateMachineKey = {};
      const baseObj: StateMachineKey = {};
      const arrObj: StateMachineKey = {};

      const baseConfig = JSON.parse(
          JSON.stringify(config, (key, value) => {
              if (Array.isArray(value)) {
                  arrConfig[key] = value;
                  arrObj[key] = data[key];
                  return undefined;
              }
              key && (baseObj[key] = data[key]);
              return value;
          })
      );
      return {
          baseConfig,
          arrConfig,
          baseObj,
          arrObj,
      };
  }
  // 状态编译
  static compile(data, status) {
      const allStatus = {};
      for (const item of status) {
          const [config, value] = item;
          const { condition = true, ..._config } = config;
          const { baseConfig, arrConfig, baseObj, arrObj } = StateMachine.filter(_config, data);
          const isMeet = StateMachine.meet({
              baseConfig,
              arrConfig,
              baseObj,
              arrObj,
          });
          const isArr = Array.isArray(value);
          if (isMeet && condition) {
              if (isArr) {
                  value.forEach((key) => {
                      allStatus[key] = true;
                  });
              } else {
                  allStatus[value] = true;
              }
          }
      }
      return allStatus;
  }
  // 注入条件 获取状态
  inject(data: StateMachineKey): {
      statusList: any;
      size: number;
  } {
      const statusList = StateMachine.compile(data, this._status);
      const size = Object.keys(statusList).length;
      return {
          statusList,
          size,
      };
  }
}

