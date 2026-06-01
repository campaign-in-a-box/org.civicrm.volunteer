{literal}
<script>
(function() {
  function guardHashRouteSelector(original) {
    return function(selectors) {
      if (typeof selectors === 'string' && selectors.indexOf('#/') === 0) {
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
})();
</script>
  <crm-angular-js modules="crmApp" id="crm_volunteer_angular_frame">
    <div ng-view></div>
  </crm-angular-js>
{/literal}
