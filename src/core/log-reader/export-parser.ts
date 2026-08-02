export type ParseObservationLogResult =
  { ok: true; value: unknown } | { ok: false; error: ReaderParseError };

export interface ReaderParseError {
  code: 'empty_file' | 'invalid_json' | 'file_read_failed';
  message: string;
  position?: number;
}

export function parseObservationLogExport(text: string): ParseObservationLogResult {
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: 'empty_file',
        message: 'ファイルが空です。JSON形式の観測ログを選択してください。',
      },
    };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error: unknown) {
    const raw = error instanceof Error ? error.message : '';
    const matched = /position\s+(\d+)/i.exec(raw);
    const position = matched?.[1] === undefined ? undefined : Number(matched[1]);
    return {
      ok: false,
      error: {
        code: 'invalid_json',
        message: 'JSONとして解析できませんでした。ファイルは変更されていません。',
        ...(position === undefined || !Number.isFinite(position) ? {} : { position }),
      },
    };
  }
}
