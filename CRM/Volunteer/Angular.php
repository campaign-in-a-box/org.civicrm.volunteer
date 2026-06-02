<?php

class CRM_Volunteer_Angular {

  private static $loaded = FALSE;

  /**
   * @return boolean
   */
  public static function isLoaded() {
    return self::$loaded;
  }

  /**
   * Loads dependencies for CiviVolunteer Angular app.
   *
   * @param string $defaultRoute
   *   If the base page is loaded with no route, show this one.
   */
  public static function load($defaultRoute) {
    if (self::isLoaded()) {
      return;
    }

    CRM_Core_Resources::singleton()->addScriptFile('civicrm.packages', 'jquery/plugins/jquery.notify.min.js', 10, 'html-header');

    // Astra (and similar WP themes) call querySelector(window.location.hash) on
    // hashchange. Angular routes like #/volunteer/my-shifts are not valid selectors.
    Civi::resources()->addScript(
      '(function() {
        function guardHashRouteSelector(original) {
          return function(selectors) {
            if (typeof selectors === "string" && selectors.indexOf("#/") === 0) {
              return null;
            }
            return original.apply(this, arguments);
          };
        }
        var docProto = Document.prototype;
        if (!docProto.querySelector._volunteerHashRouteGuard) {
          docProto.querySelector = guardHashRouteSelector(docProto.querySelector);
          docProto.querySelector._volunteerHashRouteGuard = true;
        }
        if (docProto.querySelectorAll && !docProto.querySelectorAll._volunteerHashRouteGuard) {
          docProto.querySelectorAll = guardHashRouteSelector(docProto.querySelectorAll);
          docProto.querySelectorAll._volunteerHashRouteGuard = true;
        }
      })();',
      ['position' => 'html-header', 'weight' => -100]
    );

    $loader = Civi::service('angularjs.loader');
    $loader->addModules(['volunteer']);
    $loader->setPageName('civicrm/vol');
    \Civi::resources()->addSetting([
      'crmApp' => [
        'defaultRoute' => $defaultRoute,
      ],
    ]);

    self::$loaded = TRUE;
  }

}
