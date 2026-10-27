#!/bin/sh
# Chequeo de salud cada 5 min; registra caídas y cambios de estado en /var/log/qh-uptime.log.
L=/var/log/qh-uptime.log; S=/run/qh-uptime.estado
C=$(curl -s -o /dev/null -m 10 -w "%{http_code}" https://crm.quisqueyahome.com/api/health)
A=$(cat $S 2>/dev/null); N=$([ "$C" = 200 ] && echo ok || echo caido)
[ "$N" != "$A" ] && echo "$(date -Is) $N http=$C" >> $L
echo $N > $S
if [ "$N" = caido ] && [ "$A" = caido ]; then
  printf "Subject: [Quisqueya CRM] caido (http=%s)\n\nEl chequeo de salud falla desde hace >5 min.\n" "$C" | sendmail -f no-reply@quisqueyahome.com wilber.alitoeirl@gmail.com 2>/dev/null || true
fi
