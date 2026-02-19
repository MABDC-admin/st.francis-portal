export interface Agent {
  agent_id: string;
  hostname: string;
  operating_system: string;
  status: string;
  last_seen: string;
  plat: string;
  needs_reboot: boolean;
  patches_pending: number;
  meshnode_id?: string;
  cpu_model?: string[];
  total_ram?: number;
  disks?: { device: string; total: string; used: string; percent: number }[];
  public_ip?: string;
  local_ips?: string;
  boot_time?: number;
  logged_in_username?: string;
  agent_version?: string;
  site_name?: string;
  client_name?: string;
  description?: string;
  monitoring_type?: string;
}

export interface ConnectedAgent extends Agent {
  controlUrl?: string;
  connectionError?: string;
}

export type ViewMode = 'card' | 'table';
export type StatusFilter = 'all' | 'online' | 'offline' | 'reboot';
