(function (angular, $, _) {

  angular.module('volunteer').config(function ($routeProvider) {
    $routeProvider.when('/volunteer/my-shifts', {
      controller: 'VolunteerMyShifts',
      templateUrl: '~/volunteer/MyShifts.html',
      resolve: {
        contactId: function () {
          var cid = (CRM.config && CRM.config.cid) || CRM.userContactID || null;
          if (!cid) {
            CRM.alert(
              ts('You must be logged in to manage your volunteer shifts.', { domain: 'org.civicrm.volunteer' }),
              ts('Login required'),
              'error'
            );
          }
          return cid;
        },
        assignments: function (crmApi, contactId) {
          if (!contactId) {
            return { values: {} };
          }
          return crmApi('VolunteerAssignment', 'get', {
            assignee_contact_id: contactId,
            options: { limit: 0 }
          });
        }
      }
    });
  });

  angular.module('volunteer').controller('VolunteerMyShifts', function (
    $scope, $window, crmApi, crmStatus, contactId, assignments
  ) {
    var ts = $scope.ts = CRM.ts('org.civicrm.volunteer');

    $scope.contactId = contactId;
    $scope.shifts = _.values((assignments && assignments.values) || {});
    $scope.editing = {};

    $scope.hasShifts = function () {
      return $scope.shifts && $scope.shifts.length > 0;
    };

    $scope.formatDate = function (shift) {
      var when = shift.start_time || shift.activity_date_time;
      if (!when) {
        return ts('Flexible');
      }
      // Render using the user's locale.
      var d = new Date(when.replace(' ', 'T'));
      if (isNaN(d.getTime())) {
        return when;
      }
      return d.toLocaleString();
    };

    $scope.editShift = function (shift) {
      // Snapshot fields the volunteer is allowed to change so we can revert.
      $scope.editing[shift.id] = {
        time_scheduled_minutes: shift.time_scheduled_minutes,
        time_completed_minutes: shift.time_completed_minutes,
        details: shift.details
      };
    };

    $scope.cancelEdit = function (shift) {
      var snapshot = $scope.editing[shift.id];
      if (snapshot) {
        shift.time_scheduled_minutes = snapshot.time_scheduled_minutes;
        shift.time_completed_minutes = snapshot.time_completed_minutes;
        shift.details = snapshot.details;
      }
      delete $scope.editing[shift.id];
    };

    $scope.isEditing = function (shift) {
      return $scope.editing.hasOwnProperty(shift.id);
    };

    $scope.saveShift = function (shift) {
      var payload = {
        id: shift.id,
        time_scheduled_minutes: shift.time_scheduled_minutes,
        time_completed_minutes: shift.time_completed_minutes,
        details: shift.details
      };
      return crmStatus(
        { start: ts('Saving...'), success: ts('Shift updated') },
        crmApi('VolunteerAssignment', 'create', payload).then(function () {
          delete $scope.editing[shift.id];
        })
      );
    };

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

    $scope.findMore = function () {
      $window.location.hash = '#/volunteer/opportunities';
    };
  });

})(angular, CRM.$, CRM._);
