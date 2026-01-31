import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Enable public permissions for blog-posts
    try {
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (publicRole) {
        const blogPostPermissions = [
          { action: 'api::blog-post.blog-post.find' },
          { action: 'api::blog-post.blog-post.findOne' },
        ];

        // Get existing permissions
        const existingPermissions = await strapi
          .query('plugin::users-permissions.permission')
          .findMany({
            where: {
              role: publicRole.id,
              action: {
                $in: blogPostPermissions.map((p) => p.action),
              },
            },
          });

        const existingActions = existingPermissions.map((p) => p.action);

        // Create missing permissions
        for (const perm of blogPostPermissions) {
          if (!existingActions.includes(perm.action)) {
            await strapi
              .query('plugin::users-permissions.permission')
              .create({
                data: {
                  ...perm,
                  role: publicRole.id,
                },
              });
          }
        }
      }
    } catch (error) {
      // Silently fail if permissions already exist or role doesn't exist
      console.log('Bootstrap: Permissions setup skipped or already configured');
    }
  },
};
