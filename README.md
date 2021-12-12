# 프론트엔드 과제

## 파이어베이스

### Used Features

- Authentication (Email)
- Firestore
- Functions

### Firestore Rules

```yxml
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{user} {
      allow read: if request.auth != null;
    }

    match /chatRooms/{chatRoom} {
      allow read: if request.auth != null &&
      chatRoom in	get(/databases/$(database)/documents/users/$(request.auth.uid)).data.chats;
    }

    match /messages/{message} {
      allow read: if request.auth != null &&
      resource.data.chatRoomId in	get(/databases/$(database)/documents/users/$(request.auth.uid)).data.chats;
    }
  }
}
```

### Firestore Indexes

Collection Name | Fields Indexed

- messages | chatRoomId Ascending sentAt Ascending

## Run (DEV)

1. Firebase 프로젝트 생성 및 필요한 기능들을 켜놓습니다.

2. renderer 폴더 밑에 .env 파일을 만든 후 .env.template 파일 내용을 참고하여, 환경변수 값을 세팅합니다.

3. functions 폴더 안에서 `npm install` 명령어로 패키지를 설치합니다.

4. functions 폴더 안에서 `npm run deploy` 명령어로 함수를 배포합니다.

5. 루트 폴더에서 `npm install` 명령어로 패키지를 설치합니다.

6. 루트 폴더에서 `npm run dev` 명령어를 실행하면 개발 모드로 프로그램이 실행됩니다.
