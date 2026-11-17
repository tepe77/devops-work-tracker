<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEvidenceRequest;
use App\Models\Evidence;
use App\Models\Task;
use App\Services\EvidenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EvidenceController extends Controller
{
    public function __construct(
        protected EvidenceService $evidenceService
    ) {}

    public function store(StoreEvidenceRequest $request): RedirectResponse
    {
        $task = Task::findOrFail($request->validated('task_id'));
        $this->authorize('update', $task);

        $this->evidenceService->upload(
            task: $task,
            file: $request->file('file'),
            uploader: $request->user(),
            taskUpdateId: $request->input('task_update_id'),
            caption: $request->input('caption')
        );

        return back()->with('success', 'Evidence berhasil diunggah secara aman.');
    }

    public function download(Request $request, Evidence $evidence): Response|StreamedResponse
    {
        $inline = (bool) $request->query('inline', false);

        return $this->evidenceService->download($evidence, $inline);
    }

    public function destroy(Request $request, Evidence $evidence): RedirectResponse
    {
        $this->authorize('delete', $evidence);

        $this->evidenceService->delete($evidence, $request->user());

        return back()->with('success', 'Evidence berhasil dihapus.');
    }
}
