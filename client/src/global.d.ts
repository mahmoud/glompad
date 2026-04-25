declare interface Window {
  glompad_meta: {
    version: string;
    all_versions: string[];
    build_timestamp: string;
  } | undefined;
  copysuccess: (e: Event) => void;
}
