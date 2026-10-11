// v2 생성 원본을 규격에 맞춰 재조립한다. 원본과 가공 소스는 sources/에 보존한다.
// 이전 컨셉 제작 코드는 rejected/concept_v1/prepare.mjs에 보관했다.
const stages={body:'build-v2',outfit:'finish-v2',composite:'compose-v2'};
const stage=process.argv[2];
if(!stages[stage])throw Error('사용법: node docs/art-production/hero-layered/prepare.mjs body|outfit|composite');
await import(`./sources/${stages[stage]}.mjs`);
