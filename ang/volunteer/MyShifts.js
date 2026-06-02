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

    $scope.hasTextContent = function (html) {
      if (!html) {
        return false;
      }
      return String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0;
    };

    $scope.hasProjectDescription = function (project) {
      return project && $scope.hasTextContent(project.description);
    };

    $scope.hasRoleDescription = function (shift) {
      return shift && $scope.hasTextContent(shift.role_description);
    };

    $scope.showDetailAlert = function (title, html) {
      var existing = document.querySelector('dialog.crm-vol-detail-alert');
      if (existing) {
        existing.remove();
      }

      var dialog = document.createElement('dialog');
      dialog.className = 'crm-dialog crm-alert crm-vol-detail-alert';

      if (title) {
        var heading = document.createElement('h1');
        heading.textContent = title;
        dialog.appendChild(heading);
      }

      var content = document.createElement('div');
      content.className = 'crm-vol-detail-alert-content';
      content.innerHTML = html;
      dialog.appendChild(content);

      var buttons = document.createElement('div');
      buttons.className = 'crm-buttons crm-flex-justify-end';
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'crm-button';
      ok.textContent = ts('OK');
      ok.addEventListener('click', function () {
        dialog.close();
        dialog.remove();
      });
      buttons.appendChild(ok);
      dialog.appendChild(buttons);

      document.body.appendChild(dialog);
      dialog.showModal();
    };

    $scope.showProjectDescription = function (project) {
      var description = project.description;
      var addressBlock = '';
      var campaignBlock = '';

      if (project.hasOwnProperty('campaign_title') && !_.isEmpty(project.campaign_title)) {
        campaignBlock = '<p><strong>' + ts('Campaign:') + '</strong><br />' + project.campaign_title + '</p>';
      }

      if (project.hasOwnProperty('location')) {
        if (!_.isEmpty(project.location.street_address)) {
          addressBlock += project.location.street_address + '<br />';
        }
        if (!_.isEmpty(project.location.city)) {
          addressBlock += project.location.city + '<br />';
        }
        if (!_.isEmpty(project.location.postal_code)) {
          addressBlock += project.location.postal_code;
        }
      }
      if (!_.isEmpty(addressBlock)) {
        addressBlock = '<p><strong>Location:</strong><br />' + addressBlock + '</p>';
      }
      $scope.showDetailAlert(project.title, description + campaignBlock + addressBlock);
    };

    $scope.showRoleDescription = function (shift) {
      $scope.showDetailAlert(shift.role_label, shift.role_description);
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
