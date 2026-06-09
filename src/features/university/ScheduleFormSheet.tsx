import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toast'
import { errorMessage } from '@/lib/errors'
import { WEEKDAYS_LONG } from '@/lib/dates'
import { useCreateSchedule } from './hooks'

export function ScheduleFormSheet({ courseId, onClose }: { courseId: string; onClose: () => void }) {
  const create = useCreateSchedule()
  const [weekday, setWeekday] = useState('1')
  const [start, setStart] = useState('19:00')
  const [end, setEnd] = useState('20:30')
  const [room, setRoom] = useState('')
  const [modality, setModality] = useState('presencial')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await create.mutateAsync({
        course_id: courseId,
        weekday: Number(weekday),
        start_time: start,
        end_time: end,
        room: room.trim() || null,
        modality,
      })
      toast.success('Bloque de clase agregado')
      onClose()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Sheet open onClose={onClose} title="Agregar clase">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Día">
          <Select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
            {WEEKDAYS_LONG.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
          </Field>
          <Field label="Término">
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sala">
            <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Opcional" />
          </Field>
          <Field label="Modalidad">
            <Select value={modality} onChange={(e) => setModality(e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </Select>
          </Field>
        </div>
        <Button type="submit" fullWidth disabled={create.isPending} className="mt-1">
          {create.isPending ? 'Guardando…' : 'Agregar clase'}
        </Button>
      </form>
    </Sheet>
  )
}
