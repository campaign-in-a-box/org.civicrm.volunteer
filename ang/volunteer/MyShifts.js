(function (angular, $, _) {

  angular.module('volunteer').config(function ($routeProvider) {
    $routeProvider.when('/volunteer/my-shifts', {
      controller: 'VolunteerMyShifts',
      templateUrl: '~/volunteer/MyShifts.html',
    });
  });

  angular.module('volunteer').controller('VolunteerMyShifts', function (
    $scope, $location, crmApi, crmStatus
  ) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');

    function getContactId() {
      var cid = (CRM.config && CRM.config.cid) || CRM.userContactID || null;
      if (!cid || cid === '0' || cid === 0) {
        return null;
      }
      return cid;
    }

    $scope.contactId = getContactId();
    $scope.shifts = [];
    $scope.loading = true;

    $scope.hasShifts = function () {
      return $scope.shifts && $scope.shifts.length > 0;
    };

    $scope.formatWhen = function (shift) {
      if (shift.display_time) {
        return shift.display_time;
      }
      var when = shift.start_time || shift.activity_date_time;
      if (!when) {
        return ts('Flexible');
      }
      var d = new Date(when.replace(' ', 'T'));
      if (isNaN(d.getTime())) {
        return when;
      }
      return d.toLocaleString();
    };

    $scope.formatBeneficiaries = function (shift) {
      if (!shift.beneficiaries || !shift.beneficiaries.length) {
        return '—';
      }
      return _.map(shift.beneficiaries, 'display_name').join(', ');
    };

    if ($scope.contactId) {
      crmApi('VolunteerAssignment', 'get', {
        assignee_contact_id: $scope.contactId,
        options: { limit: 0 }
      }).then(function (result) {
        $scope.shifts = _.values((result && result.values) || {});
      }, function () {
        $scope.shifts = [];
      }).finally(function () {
        $scope.loading = false;
      });
    }
    else {
      $scope.loading = false;
    }

    $scope.cancelShift = function (shift) {
      CRM.confirm({
        title: ts('Cancel this shift?'),
        message: ts('Are you sure you want to remove your sign-up for this shift? This cannot be undone.')
      }).on('crmConfirm:yes', function () {
        crmStatus(
          { start: ts('Cancelling...'), success: ts('Shift cancelled') },
          crmApi('VolunteerAssignment', 'delete', { id: shift.id }).then(function () {
            $scope.shifts = _.filter($scope.shifts, function (s) {
              return s.id !== shift.id;
            });
            $scope.$apply();
          })
        );
      });
    };

    $scope.findMore = function ($event) {
      if ($event) {
        $event.preventDefault();
      }
      $location.path('/volunteer/opportunities');
    };
  });

})(angular, CRM.$, CRM._);
