export type ActionAfterReception = "react" | "delete" | "quiet";

export interface TGInboxSettings {
  token: string;
  marker: string;
  allow_users: string[];
  download_dir: string;
  download_media: boolean;
  media_filter_voice: boolean;
  media_filter_audio: boolean;
  media_filter_photo: boolean;
  media_filter_video: boolean;
  media_filter_document: boolean;
  message_template: string;
  markdown_escaper: boolean;
  is_custom_file: boolean;
  custom_file_path: string;
  disable_auto_reception: boolean;
  reverse_order: boolean;
  remove_formatting: boolean;
  run_after_sync: boolean;
  daily_note_time_cutoff: string; // Format: "HH:MM" (24-hour format)
  daily_note_timezone: string; // IANA timezone, empty means system timezone
  insert_after_heading: boolean;
  target_heading: string;
  action_after_reception: ActionAfterReception;
}

export const DEFAULT_SETTINGS: TGInboxSettings = {
  token: "",
  marker: "#inbox",
  allow_users: [],
  download_dir: "/assets",
  download_media: false,
  media_filter_voice: true,
  media_filter_audio: true,
  media_filter_photo: true,
  media_filter_video: true,
  media_filter_document: true,
  markdown_escaper: false,
  message_template: "{{{text}}}",
  is_custom_file: false,
  custom_file_path: "Telegram-Inbox.md",
  disable_auto_reception: false,
  reverse_order: false,
  remove_formatting: false,
  run_after_sync: true,
  daily_note_time_cutoff: "00:00",
  daily_note_timezone: "",
  insert_after_heading: false,
  target_heading: "## Inbox",
  action_after_reception: "react",
};
