'use strict';

export class Point {
  constructor(x, y) {
    // this.x = boolean || boolean 에서는 두 boolean 값 중에서 하나만 true여도 true를 return하고,
    // 둘 다 false일 때에만 false를 return해 줌. 0은 기본적으로 false로 인식함.
    // ||, && 같은 논리연산자는 보통 boolean값과 같이 사용되는데, 그래서 논리연산의 결과 boolean값을 반환함.
    // 그러나, 만약 이런 논리연산자들이 boolean이 아닌 실제로 명시된 값을 피연자로 사용한다면?
    // 그런 경우에는 실제 피연자 값을 반환함.
    // 그에 따라, x, y가 true라면 실제 x, y의 값을 반환하고, 
    // x, y가 undefined로 false라면, 0도 false이므로 0을 반환하게 되어있음.
    // x, y가 존재한다면 this.x,y에는 x, y가 들어가고, 존재하지 않는다면 0이 들어간다는 뜻.
    this.x = x || 0;
    this.y = y || 0;
  }

  add(point) {
    this.x += point.x;
    this.y += point.y;
    return this;
    // 이 this는 새롭게 생성될 new Point의 인스턴스를 가리키겠지?
    // 만약 this.sth = new Point(); 해놓았다면
    // this.sth.add(point); 한다면, this.sth.x, y 에는 point.x, y가 더해진 값이 할당되겠지?
    // 이런 식으로 메소드가 사용될 수 있을 것.
  }

  subtract(point) {
    this.x -= point.x;
    this.y -= point.y;
    return this;
  }

  reduce(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }

  collide(point, width, height) {
    // this.x, y 좌표가 각각
    // point.x <= this.x <= point.x + width
    // point.y <= this.y <= point.y + height의 범위 안에 있을 때에만 true를 return하라는 뜻
    // this안에 담긴 x, y좌표값이 이 범위를 조금이라도 벗어나면 false를 return하라는 거겠지?
    if (this.x >= point.x &&
      this.x <= point.x + width &&
      this.y >= point.y &&
      this.y <= point.y + height) {
      return true;
    } else {
      return false;
    }
  }

  // 얘는 이미 생성된 new Point() 인스턴스의 this.x, y 좌표값을 가져와서 
  // 똑같은 point 인스턴스를 복사하여 생성하는 메소드 같은데 
  clone() {
    return new Point(this.x, this.y);
  }
}