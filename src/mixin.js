import { getOwnPropertyDescriptors, getOwnKeys } from './private/utils';

const { defineProperty, getPrototypeOf } = Object;

//只有Symbol对象会返回true
//Object.prototype.toString.call(Symbol());
function buggySymbol(symbol) {
  return Object.prototype.toString.call(symbol) === '[object Symbol]' && typeof(symbol) === 'object';
}

//调用方式：hasProperty(key, target.prototype)
function hasProperty(prop, obj) {
  // We have to traverse manually prototypes' chain for polyfilled ES6 Symbols
  // like "in" operator does.
  //对于ES6的Symbol类型，我们必须手动去遍历原型链，就像in操作符一样
  // I.e.: Babel 5 Symbol polyfill stores every created symbol in Object.prototype.
  // That's why we cannot use construction like "prop in obj" to check, if needed
  // prop actually exists in given object/prototypes' chain.
  if (buggySymbol(prop)) {
    do {
      if (obj === Object.prototype) {
        // Object.prototype具有很多方法，如defineProperty等函数
        // Polyfill assigns undefined as value for stored symbol key.
        // We can assume in this special case if there is nothing assigned it doesn't exist.
        //如果当前的Object原型对象的某个属性不是undefined，那么表示当前原型对于有这个属性
        return typeof(obj[prop]) !== 'undefined';
      }
      //如果当前原型对象有这个属性，那么返回true
      if (obj.hasOwnProperty(prop)) {
        return true;
      }
    } while (obj = getPrototypeOf(obj));
    //继续遍历上一个原型对象

    return false;
  } else {
    //如果不是Symble类型，那么我们直接使用in操作符来完成
    return prop in obj;
  }
}

//如果第一个参数就是函数，那么其实就是啥也没有做
function handleClass(target, mixins) {
  if (!mixins.length) {
    throw new SyntaxError(`@mixin() class ${target.name} requires at least one mixin as an argument`);
  }

  for (let i = 0, l = mixins.length; i < l; i++) {
    const descs = getOwnPropertyDescriptors(mixins[i]);
    /*
    const Theme = {
      setTheme() {}
    };
    这个对象通过getOwnPropertyDescriptors获取到的对象如下：
     setTheme:{
        configurable:true
        enumerable:true
        value:()
        writable:true
     }
        */
    //获取的是mixin中每一个元素的属性描述符
    const keys = getOwnKeys(descs);
    //得到所有的key值，如setTheme等
    for (let j = 0, k = keys.length; j < k; j++) {
      const key = keys[j];
       //如果目标的《原型上》没有这个key，那么我们才会使用definePropery来完成
      if (!(hasProperty(key, target.prototype))) {
        defineProperty(target.prototype, key, descs[key]);
      }
    }
  }
}

export default function mixin(...mixins) {
  //第一个参数是否是函数，如果是那么返回handleClass
  if (typeof mixins[0] === 'function') {
    return handleClass(mixins[0], []);
  } else {
    //如果不是函数，比如是对象,这时候允许你再传入一个对象作为target。如下例：
    /*
    import React, { Component } from 'React';
    import { mixin } from 'core-decorators';
    const PureRender = {
      shouldComponentUpdate() {}
    };
    const Theme = {
      setTheme() {}
    };
    @mixin(PureRender, Theme)
    class MyComponent extends Component {
      render() {}
    }
    */
    return target => {
      return handleClass(target, mixins);
    };
  }
}
