import { findMenuByCode } from '../models/menuModel.js';
import { checkPrivilege } from '../models/privilegeModel.js';

export const rbacMiddleware = (menuCode) => {
  return async (req, res, next) => {
    try {
      const menu = await findMenuByCode(menuCode);

      // A route was protected with a menu_code that doesn't exist in the
      // DB — this is a misconfiguration on OUR end, not the user's fault.
      // 500, not 403, so it's clearly distinguishable when debugging.
      if (!menu) {
        return res.status(500).json({
          success: false,
          message: `Server misconfiguration: no menu found for code "${menuCode}"`,
        });
      }

      const hasAccess = await checkPrivilege(req.user.roleId, menu.menu_id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource.',
        });
      }

      next();
    } catch (error) {
      next(error); // let errorMiddleware handle anything unexpected
    }
  };
};