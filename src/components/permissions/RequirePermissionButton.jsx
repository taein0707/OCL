import { useRequirePermission } from '../../hooks/useRequirePermission.js'
import PermissionDeniedSheet from './PermissionDeniedSheet.jsx'

/**
 * 사용 시점에만 권한을 요청하는 버튼 래퍼.
 *
 * 예시:
 *   <RequirePermissionButton
 *     kind="camera"
 *     onAllowed={() => openCameraSheet()}
 *     className="..."
 *   >
 *     사진 촬영
 *   </RequirePermissionButton>
 */
function RequirePermissionButton({
  kind,
  onAllowed,
  children,
  className = '',
  disabled = false,
  ...rest
}) {
  const gate = useRequirePermission(kind)

  const handleClick = async () => {
    await gate.run(async () => {
      if (typeof onAllowed === 'function') await onAllowed()
    })
  }

  return (
    <>
      <button type="button" {...rest} disabled={disabled} onClick={handleClick} className={className}>
        {children}
      </button>
      <PermissionDeniedSheet open={gate.showDenial} kind={kind} onClose={gate.closeDenial} />
    </>
  )
}

export default RequirePermissionButton
