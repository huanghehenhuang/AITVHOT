# 2026-11-11 新闻媒体化改版发布

已发布到 https://aitvhot.top/ 。

- 生产版本为 ui-2554784，对应提交 25547845789df20c05a780fd436cceaad8d435d2。
- CI 运行 https://github.com/huanghehenhuang/AITVHOT/actions/runs/42935205301 全部通过后生成 linux/amd64 发布镜像。
- 服务器核对 GitHub 产物 SHA-256，并核对内部镜像归档及 release.txt 的 SHA256SUMS。
- 先在临时 API 与网页实例上使用生产数据验证。临时数据库连接启动时确认 transaction_read_only=on。
- 日期与来源筛选、事件 RSS、整站冒烟通过。正式域名的 390px、1440px 浅色与深色页面通过检查，未发现横向溢出或脚本错误，英文页面正常。
- 保留已上线的信源 POST 表单处理和信源标识修复。更新 API 与 web，worker、数据库和隧道的容器 ID 与发布前一致。
- 网页挂载合并后的新旧静态资源，供未刷新的页面加载旧文件。
- 发布前备份为 /opt/aitvhot/backups/aihot-20261111-085932。
- 发布目录为 /opt/aitvhot/releases/ui-2554784，保存配置、容器快照、校验文件和冒烟日志。

## 回滚

恢复发布前的 Compose 配置并重新启动 API 与 web。旧镜像保留在服务器。

~~~bash
cd /opt/aitvhot
cp releases/ui-2554784/compose-before.yml deploy/compose.huawei.yml
docker compose --env-file .env -f deploy/compose.huawei.yml up -d --no-deps --no-build api web
~~~

发布未执行数据库迁移或信源种子同步。需要撤回更新日志时，将 releases/ui-2554784/changelog-before.json 的内容写回 site/changelog.json 后再验证网站。
