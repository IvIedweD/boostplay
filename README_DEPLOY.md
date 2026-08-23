# BOOSTPLAY — готовый корень GitHub-репозитория

Загрузите **содержимое этой папки** в корень публичного репозитория. Не загружайте родительскую папку `BOOSTPLAY-ready`.

Уже подготовлено:

- GitHub Actions workflow `.github/workflows/deploy-pages.yml`;
- автоматический базовый путь для `https://LOGIN.github.io/REPOSITORY/`;
- SPA fallback для прямого открытия `/login`, `/play`, `/admin` и других маршрутов;
- lint, тесты и production-сборка перед каждой публикацией;
- `.gitignore`, исключающий `.env.local`, `node_modules` и `dist`.

Создайте пустой публичный репозиторий без README и `.gitignore`, затем выполните:

```powershell
git init
git add .
git status --short
git commit -m "Initial BOOSTPLAY deployment"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/boostplay.git
git push -u origin main
```

Перед commit убедитесь, что в списке нет `.env.local`, паролей и server/service-role ключей.
