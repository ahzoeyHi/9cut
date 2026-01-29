import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '项目列表' }
  },
  {
    path: '/project/:id',
    name: 'Project',
    component: () => import('../views/Project.vue'),
    meta: { title: '项目详情' }
  },
  {
    path: '/project/:id/storyboard',
    name: 'Storyboard',
    component: () => import('../views/Storyboard.vue'),
    meta: { title: '分镜编辑' }
  },
  {
    path: '/project/:id/nine-grid',
    name: 'NineGrid',
    component: () => import('../views/NineGrid.vue'),
    meta: { title: '9宫格视图' }
  },
  {
    path: '/project/:id/script',
    name: 'ScriptEditor',
    component: () => import('../views/ScriptEditor.vue'),
    meta: { title: '口播稿生成' }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    meta: { title: '资源管理' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '系统设置' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '9Cut'} - `;
  next();
});

export default router;
