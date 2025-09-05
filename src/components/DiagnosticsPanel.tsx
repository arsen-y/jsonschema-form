import {
  Alert,
  Box,
  Collapse,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useMemo, useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { FormShape } from './FormRenderer/FieldRenderer';

interface Props {
  internalError?: unknown;
  formErrors?: FieldErrors<FormShape>;
}

export default function DiagnosticsPanel({ internalError, formErrors }: Props) {
  const hasFormErrors = useMemo(
    () => !!formErrors && Object.keys(formErrors).length > 0,
    [formErrors],
  );
  const [open, setOpen] = useState<boolean>(
    Boolean(internalError) || hasFormErrors,
  );

  if (!internalError && !hasFormErrors) return null;

  const flatten = (err: unknown, prefix = ''): string[] => {
    if (!err || typeof err !== 'object') return [];
    const e = err as Record<string, unknown>;
    const msgs: string[] = [];
    for (const [k, v] of Object.entries(e)) {
      if (v && typeof v === 'object' && 'message' in (v as object)) {
        msgs.push(
          `• ${prefix}${k}: ${(v as { message?: string }).message ?? ''}`,
        );
      } else {
        msgs.push(...flatten(v, `${prefix}${k}.`));
      }
    }
    return msgs;
  };

  const list = flatten(formErrors ?? {});

  return (
    <Collapse in={open}>
      <Alert
        severity="warning"
        action={
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        }
      >
        <Typography fontWeight={600}>Диагностика</Typography>

        {!!internalError && (
          <Box sx={{ mt: 1 }}>
            <Typography color="error">
              Внутренняя ошибка (схема или валидатор):
            </Typography>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {String((internalError as Error)?.message ?? internalError)}
            </Typography>
          </Box>
        )}

        {hasFormErrors ? (
          <Box sx={{ mt: 1 }}>
            <Divider sx={{ my: 1 }} />
            <Typography>Ошибки формы:</Typography>
            <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {list.join('\n')}
            </Typography>
          </Box>
        ) : null}
      </Alert>
    </Collapse>
  );
}
