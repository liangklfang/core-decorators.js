import lazyInitialize from '../lazy-initialize';

const { defineProperty, getOwnPropertyDescriptor,
        getOwnPropertyNames, getOwnPropertySymbols } = Object;

//return an array of all symbol properties found directly upon the given object.
//getOwnPropertySymbols：返回一个指定对象具有的所有的Symbol属性，其返回值为一个数组
//而Object.getOwnPropertyNames()不会返回Symbol属性，只会返回字符串属性
//如果一个对象没有手动设置过Symbol属性，那么他会返回一个空数组，请看下例：
/*
  var obj = {};
  var a = Symbol('a');
  var b = Symbol.for('b');
  obj[a] = 'localSymbol';
  obj[b] = 'globalSymbol';
  var objectSymbols = Object.getOwnPropertySymbols(obj);
  console.log(objectSymbols.length); // 2
  console.log(objectSymbols);        // [Symbol(a), Symbol(b)]
  console.log(objectSymbols[0]);     // Symbol(a)
*/


//因为Descriptor对象也是一个对象，所以最后肯定会继承Object，所以肯定会有hasOwnPropery属性
export function isDescriptor(desc) {
  if (!desc || !desc.hasOwnProperty) {
    return false;
  }
  const keys = ['value', 'initializer', 'get', 'set'];

  for (let i = 0, l = keys.length; i < l; i++) {
    //如果该对象有只有有一个属性，value/initializer/get/set那么他就是描述符，否则为false
    if (desc.hasOwnProperty(keys[i])) {
      return true;
    }
  }

  return false;
}

export function decorate(handleDescriptor, entryArgs) {
  //如果entryArgs是一个数组，同时数组最后一个元素也是Descriptor对象
  if (isDescriptor(entryArgs[entryArgs.length - 1])) {
    return handleDescriptor(...entryArgs, []);
  } else {
    return function () {
      return handleDescriptor(...arguments, entryArgs);
    };
  }
}

class Meta {
  @lazyInitialize
  debounceTimeoutIds = {};
  @lazyInitialize
  throttleTimeoutIds = {};
  @lazyInitialize
  throttlePreviousTimestamps = {};
}

const META_KEY = (typeof Symbol === 'function')
  ? Symbol('__core_decorators__')
  : '__core_decorators__';

export function metaFor(obj) {
  if (obj.hasOwnProperty(META_KEY) === false) {
    defineProperty(obj, META_KEY, {
      // Defaults: NOT enumerable, configurable, or writable
      value: new Meta()
    });
  }

  return obj[META_KEY];
}

//(1)如果有getOwnPropertySymbols，那么直接返回getOwnPropertySymbols和getOwnPropertyNames的组合
//否则直接调用getOwnPropertyNames
export const getOwnKeys = getOwnPropertySymbols
    ? function (object) {
        return getOwnPropertyNames(object)
          .concat(getOwnPropertySymbols(object));
      }
    : getOwnPropertyNames;



//首先获取该对象具有的所有的key集合，然后把Descriptor对象赋值到一个对象上并返回
export function getOwnPropertyDescriptors(obj) {
  const descs = {};
  getOwnKeys(obj).forEach(
    key => (descs[key] = getOwnPropertyDescriptor(obj, key))
  );

  return descs;
}

//这里是创建一个默认的setter方法，其底层是调用defineProperty来完成的
export function createDefaultSetter(key) {
  return function set(newValue) {
    Object.defineProperty(this, key, {
      configurable: true,
      writable: true,
      // IS enumerable when reassigned by the outside word
      enumerable: true,
      value: newValue
    });

    return newValue;
  };
}
