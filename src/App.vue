<template>
  <div class="app">
    <header class="header">
      <div class="container header__inner">
        <router-link class="brand" to="/">
          <img class="brand__logo" src="/src/assets/logo.svg" alt="Recipe UA" />
          <div class="brand__text">
            <div class="brand__name">Recipe UA</div>
            <div class="brand__sub">Рецепти з того, що є вдома</div>
          </div>
        </router-link>

        <nav class="nav">
          <router-link class="nav__link" to="/">Головна</router-link>
          <router-link class="nav__link" to="/favorites">Улюблене</router-link>
          <router-link class="nav__link" to="/about">Про проєкт</router-link>
        </nav>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="container footer__inner">
        <div>© 2026 • Recipe UA • Навчальний проєкт</div>
        <div class="footer__links">
          <a href="https://www.themealdb.com/api.php" target="_blank" rel="noreferrer">TheMealDB</a>
          <span>•</span>
          <a href="https://fdc.nal.usda.gov/api-guide" target="_blank" rel="noreferrer">USDA FDC</a>
        </div>
      </div>
    </footer>
  </div>
</template>
