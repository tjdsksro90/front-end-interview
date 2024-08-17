# Q : z-index와 스택 문맥이 형성되는 방식에 대해 설명해주세요.

<br />

# A :

**`CSS`는 `HTML` 요소의 쌓임순서를 명시적으로 제공하는 `z-index`라는 속성이 제공됩니다**

- 여기서 요소들은 `position` 속성이 `static`이 아닌 이외의 값을 가진 요소들을 뜻합니다.
- 이를 통해 `z-index`가 더 높은값을 가진 요소가 맨 위에 표시되게 됩니다.
- `z-index`가 클수록 사용자에게 더 까가이 보이게 됩니다.

**스택문맥**

- 스택문맥이란 `HTML`요소의 쌓임순서, 즉, 어떤것이 다른것이 위에 쌓이는지를 제어하는 규칙의 집합입니다.
- 스택문맥을 형성하는 요소는 그 자체로 독립적인 렌더링 레이어를 형성하고, 그 레이어 내부에서만 렌더링이 발생하게 됩니다.

**스택문맥은 다음과 같은 경우에 형성됩니다**

1. 문서의 루트 요소 (`HTML`)
2. `z-index`값이 `auto`가 아닌 위치 지정 요소
3. `opactiy`속성 값이 1보다 작은 요소
4. `transform`,`filter`,` perspective``mask `,`clip-path` 속성 중 어느 하나라도 `none`이 아닌 값을 가진 요소
5. `flex`또는 `gird` 컨테이너의 자식 요소로서, `z-index`값이 `auto`가 아닌 요소
6. `mix-blend-mode` 속성 값이 `normal`이 아닌 요소

- 이렇게 스택 문맥을 이루는 요소들은 자신의 안에 있는 요소들에 대한 렌더링 순서를 결정하고, 스택 문맥 밖에 서는 독립적으로 동작하게 됩니다.
  - 따라서 `z-index`는 각 스택 문맥 내에서만 의미를 가지게 됩니다