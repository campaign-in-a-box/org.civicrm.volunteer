-- CIB: add staff notes to volunteer opportunities (upgrade 2401)
ALTER TABLE `civicrm_volunteer_need`
  ADD `notes` text NULL COMMENT 'Staff notes for this opportunity, shown to volunteers when signing up.'
  AFTER `is_active`;
