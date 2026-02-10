export interface TGInboxSettings {
  token: string;
  marker: string;
  allow_users: string[];
  download_dir: string;
  download_media: boolean;
  message_template: string;
  markdown_escaper: boolean;
  is_custom_file: boolean;
  custom_file_path: string;
  disable_auto_reception: boolean;
  reverse_order: boolean;
  remove_formatting: boolean;
  run_after_sync: boolean;
  daily_note_time_cutoff: string; // Format: "HH:MM" (24-hour format)
  insert_after_heading: boolean;
  target_heading: string;
}

export const DEFAULT_SETTINGS: TGInboxSettings = {
  token: "",
  marker: "#inbox",
  allow_users: [],
  download_dir: "/assets",
  download_media: false,
  markdown_escaper: false,
  message_template: "{{{text}}}",
  is_custom_file: false,
  custom_file_path: "Telegram-Inbox.md",
  disable_auto_reception: false,
  reverse_order: false,
  remove_formatting: false,
  run_after_sync: true,
  daily_note_time_cutoff: "00:00",
  insert_after_heading: false,
  target_heading: "## Inbox",
};
