CREATE TABLE notification_settings (
    user_id BIGINT PRIMARY KEY,
    match_proposal BOOLEAN NOT NULL DEFAULT TRUE,
    proposal_response BOOLEAN NOT NULL DEFAULT TRUE,
    deadline_alert BOOLEAN NOT NULL DEFAULT TRUE,
    message_alert BOOLEAN NOT NULL DEFAULT TRUE,
    match_success BOOLEAN NOT NULL DEFAULT TRUE,
    announcement BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_notification_settings_user FOREIGN KEY (user_id) REFERENCES users(id)
);
