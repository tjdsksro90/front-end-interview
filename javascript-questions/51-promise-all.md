# Q : Promise.all에 대해서 간단히 설명해주세요.

<br />

# A : 여러 비동기 작업의 결과를 한꺼번에 기다리는 함수. 모두 성공하면 **입력한 순서대로 결과 배열**을 반환, 하나라도 실패하면 전체가 실패. 이때 나머지 작업이 자동으로 취소되진 않는다.

```javascript
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts(),
]);
```
