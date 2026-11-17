<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan DevOps Work Tracker</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.5;
            margin: 20px;
        }
        .header {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #0f172a;
            font-size: 18px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
        }
        .header p {
            margin: 2px 0;
            color: #64748b;
            font-size: 11px;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-info { background: #e0f2fe; color: #0369a1; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-danger { background: #fee2e2; color: #b91c1c; }
        .metrics-grid {
            margin-bottom: 20px;
            border-collapse: collapse;
            width: 100%;
        }
        .metric-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 10px;
            text-align: center;
        }
        .metric-card .number {
            font-size: 18px;
            font-weight: bold;
            color: #0284c7;
        }
        .metric-card .label {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.data-table th, table.data-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }
        table.data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 10px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin: 16px 0 8px 0;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DevOps Work Tracker &mdash; Laporan {{ ucfirst($report['type']) }}</h1>
        <p><strong>Periode:</strong> {{ $report['formatted_date'] ?? $report['formatted_period'] ?? $report['formatted_month'] ?? 'N/A' }}</p>
        <p><strong>Waktu Export:</strong> {{ now('Asia/Jakarta')->isoFormat('D MMMM Y, HH:mm:ss') }} WIB | Timezone: Asia/Jakarta</p>
    </div>

    @if($report['type'] === 'daily')
        <table class="metrics-grid">
            <tr>
                <td class="metric-card">
                    <div class="number">{{ $report['total_activities'] }}</div>
                    <div class="label">Total Aktivitas Hari Ini</div>
                </td>
                <td class="metric-card">
                    <div class="number">{{ $report['total_tasks_affected'] }}</div>
                    <div class="label">Task Terkait</div>
                </td>
            </tr>
        </table>

        <div class="section-title">Detail Aktivitas Harian</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Task</th>
                    <th style="width: 20%;">Summary</th>
                    <th style="width: 30%;">Pekerjaan Dilakukan</th>
                    <th style="width: 20%;">Hasil / Kendala</th>
                    <th style="width: 15%;">Status & Progress</th>
                </tr>
            </thead>
            <tbody>
                @forelse($report['activities'] as $act)
                    <tr>
                        <td>
                            <strong>{{ $act->task->task_code }}</strong><br>
                            <small>{{ $act->task->title }}</small>
                        </td>
                        <td>{{ $act->summary }}</td>
                        <td>{{ $act->work_done }}</td>
                        <td>
                            @if($act->result)
                                <div><strong>Hasil:</strong> {{ $act->result }}</div>
                            @endif
                            @if($act->blocker)
                                <div style="color: #b91c1c;"><strong>Blocker:</strong> {{ $act->blocker }}</div>
                            @endif
                        </td>
                        <td>
                            <span class="badge badge-info">{{ $act->status->label() }}</span><br>
                            <strong>{{ $act->progress_percent }}%</strong>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center; color: #94a3b8;">Tidak ada aktivitas tercatat pada tanggal ini.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @elseif($report['type'] === 'weekly' || $report['type'] === 'monthly')
        <table class="metrics-grid">
            <tr>
                <td class="metric-card">
                    <div class="number">{{ $report['total_activities'] }}</div>
                    <div class="label">Total Aktivitas</div>
                </td>
                <td class="metric-card">
                    <div class="number">{{ $report['completed_count'] }}</div>
                    <div class="label">Pekerjaan Selesai</div>
                </td>
                @if(isset($report['in_progress_count']))
                    <td class="metric-card">
                        <div class="number">{{ $report['in_progress_count'] }}</div>
                        <div class="label">In Progress</div>
                    </td>
                @endif
                @if(isset($report['blocked_count']))
                    <td class="metric-card">
                        <div class="number" style="color: #b91c1c;">{{ $report['blocked_count'] }}</div>
                        <div class="label">Blocked</div>
                    </td>
                @endif
            </tr>
        </table>

        <div class="section-title">Log Aktivitas Periode Ini</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 12%;">Tanggal</th>
                    <th style="width: 15%;">Task</th>
                    <th style="width: 38%;">Aktivitas / Work Done</th>
                    <th style="width: 20%;">Hasil / Tindak Lanjut</th>
                    <th style="width: 15%;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse($report['activities'] as $act)
                    <tr>
                        <td>{{ $act->activity_date->format('d/m/Y') }}</td>
                        <td>
                            <strong>{{ $act->task->task_code }}</strong><br>
                            <small>{{ $act->task->title }}</small>
                        </td>
                        <td>
                            <strong>{{ $act->summary }}</strong><br>
                            {{ $act->work_done }}
                        </td>
                        <td>
                            @if($act->result) <div><strong>Hasil:</strong> {{ $act->result }}</div> @endif
                            @if($act->next_action) <div><strong>Next:</strong> {{ $act->next_action }}</div> @endif
                            @if($act->blocker) <div style="color: #b91c1c;"><strong>Blocker:</strong> {{ $act->blocker }}</div> @endif
                        </td>
                        <td>
                            <span class="badge badge-info">{{ $act->status->label() }}</span> ({{ $act->progress_percent }}%)
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" style="text-align: center; color: #94a3b8;">Tidak ada aktivitas tercatat dalam periode ini.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @endif

    <div class="footer">
        DevOps Work Tracker &bull; Dokumen Snapshot Resmi &bull; Halaman 1
    </div>
</body>
</html>
