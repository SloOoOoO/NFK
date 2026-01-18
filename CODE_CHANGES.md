# Visual Code Changes - Side by Side Comparison

## Fix 1: AdminDashboard - Logs Tab User Rendering

### File: `frontend/src/pages/portal/AdminDashboard.tsx` (Line 255-260)

```diff
  <td className="px-4 py-3 text-sm font-medium dark:text-gray-200">
-   {log.user || 'System'}
+   {typeof log.user === 'object' 
+     ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || 'System'
+     : log.user || 'System'}
  </td>
```

**Why:** Handles cases where user might be an object `{firstName, lastName}` or a string

---

## Fix 2: AdminDashboard - Statistics Null Safety

### File: `frontend/src/pages/portal/AdminDashboard.tsx` (Line 360)

```diff
  <td className="px-4 py-2 text-sm text-right font-medium dark:text-gray-200">
-   {month.count.toLocaleString('de-DE')}
+   {month.count?.toLocaleString('de-DE') || 0}
  </td>
```

**Why:** Prevents crash when `month.count` is undefined

---

## Fix 3: Profile Page - Field Mapping

### File: `frontend/src/pages/portal/Profile.tsx` (Line 55-65)

```diff
  body: JSON.stringify({
    firstName: user.firstName,
    lastName: user.lastName,
+   phone: editForm.phoneNumber,
    phoneNumber: editForm.phoneNumber,
    address: editForm.address,
    city: editForm.city,
    postalCode: editForm.postalCode,
    country: editForm.country,
    dateOfBirth: editForm.dateOfBirth,
+   taxNumber: editForm.taxId,
    taxId: editForm.taxId
  })
```

**Why:** Backend accepts both `phone` and `phoneNumber`, `taxId` and `taxNumber`

### Also improved error handling:

```diff
- const data = await response.json();
-
  if (!response.ok) {
+   const errorData = await response.json();
-   throw new Error(data.message || 'Fehler beim Aktualisieren');
+   throw new Error(errorData.message || 'Fehler beim Aktualisieren');
  }
+
+ const data = await response.json();
```

**Why:** Read response before checking status to get proper error messages

---

## Fix 4: Document Download Implementation

### File: `frontend/src/pages/portal/Documents.tsx` (Line 183-192)

```diff
- const handleDownload = async (id: number) => {
+ const handleDownload = async (documentId: number, fileName: string) => {
    try {
-     await documentsAPI.download(id);
-     alert('Download-Funktion wird bald verfügbar sein');
+     const response = await fetch(`http://localhost:8080/api/v1/documents/${documentId}/download`, {
+       headers: {
+         'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
+       }
+     });
+
+     if (!response.ok) {
+       throw new Error('Download fehlgeschlagen');
+     }
+
+     const blob = await response.blob();
+     const url = window.URL.createObjectURL(blob);
+     const a = document.createElement('a');
+     a.href = url;
+     a.download = fileName;
+     document.body.appendChild(a);
+     a.click();
+     window.URL.revokeObjectURL(url);
+     document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading document:', err);
-     alert('Download noch nicht verfügbar');
+     alert('Fehler beim Herunterladen der Datei');
    }
  };
```

### Update calls to handleDownload:

```diff
  <button 
-   onClick={() => handleDownload(doc.id)}
+   onClick={() => handleDownload(doc.id, doc.fileName || doc.name)}
    className="flex-1 text-sm text-primary dark:text-blue-400 hover:underline"
  >
    📥 Download
  </button>
```

**Why:** Implements full blob download with proper file naming

---

## Fix 5: Dashboard - Remove Dummy Data, Add Real APIs

### File: `frontend/src/pages/portal/Dashboard.tsx`

### A. Add State Variables (Line 17-18)

```diff
  const [deadlines, setDeadlines] = useState<any[]>([]);
+ const [datevStatus, setDatevStatus] = useState<any>(null);
+ const [activities, setActivities] = useState<any[]>([]);
```

### B. Update useEffect (Line 19-22)

```diff
  useEffect(() => {
    fetchDashboardData();
+   fetchDatevStatus();
+   fetchActivities();
  }, []);
```

### C. Add New API Functions (after line 104)

```diff
+ const fetchDatevStatus = async () => {
+   try {
+     const token = localStorage.getItem('accessToken');
+     const response = await fetch('http://localhost:8080/api/v1/datev/status', {
+       headers: { 'Authorization': `Bearer ${token}` }
+     });
+     if (response.ok) {
+       const data = await response.json();
+       setDatevStatus(data);
+     }
+   } catch (error) {
+     console.error('Error fetching DATEV status:', error);
+     setDatevStatus({ connected: false, lastSync: null });
+   }
+ };
+
+ const fetchActivities = async () => {
+   try {
+     const token = localStorage.getItem('accessToken');
+     const response = await fetch('http://localhost:8080/api/v1/audit/recent', {
+       headers: { 'Authorization': `Bearer ${token}` }
+     });
+     if (response.ok) {
+       const data = await response.json();
+       setActivities(Array.isArray(data) ? data : []);
+     }
+   } catch (error) {
+     console.error('Error fetching activities:', error);
+     setActivities([]);
+   }
+ };
+
+ const getActivityIcon = (type: string) => {
+   switch (type) {
+     case 'Upload':
+     case 'CREATE':
+       return '📄';
+     case 'Download':
+       return '📥';
+     case 'UPDATE':
+       return '✏️';
+     case 'DELETE':
+       return '🗑️';
+     default:
+       return '📋';
+   }
+ };
+
+ const formatRelativeTime = (timestamp: string) => {
+   const now = new Date();
+   const date = new Date(timestamp);
+   const diffMs = now.getTime() - date.getTime();
+   const diffMins = Math.floor(diffMs / 60000);
+   const diffHours = Math.floor(diffMs / 3600000);
+   const diffDays = Math.floor(diffMs / 86400000);
+
+   if (diffMins < 60) return `${diffMins}m`;
+   if (diffHours < 24) return `${diffHours}h`;
+   return `${diffDays}d`;
+ };
```

### D. Replace DATEV Activities Section (Line 262-298)

```diff
  {/* DATEV_ Recent Activity */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100">🔄 {t('dashboard.sections.datevActivity')}</h2>
      <Link to="/portal/datev" className="text-primary dark:text-blue-400 hover:underline text-sm">{t('dashboard.sections.details')} →</Link>
    </div>
    
-   <div className="space-y-3">
-     <div className="flex items-start justify-between border-b dark:border-gray-700 pb-3">
-       <div className="flex items-start gap-3">
-         <div className="w-2 h-2 rounded-full mt-2 bg-green-500 dark:bg-green-400"></div>
-         <div>
-           <p className="font-medium text-textPrimary dark:text-gray-100">{t('dashboard.sections.exportCompleted')}</p>
-           <p className="text-sm text-textSecondary dark:text-gray-400">Schmidt GmbH</p>
-         </div>
-       </div>
-       <span className="text-xs text-textSecondary dark:text-gray-400 whitespace-nowrap">{t('dashboard.sections.hoursAgo', { hours: 2 })}</span>
-     </div>
-     {/* More dummy data... */}
-   </div>
+   {datevStatus ? (
+     <div>
+       <div className="flex items-center gap-2 mb-4">
+         <span className={`w-3 h-3 rounded-full ${datevStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
+         <span className="font-medium text-textPrimary dark:text-gray-100">
+           {datevStatus.connected ? 'Verbunden' : 'Nicht verbunden'}
+         </span>
+       </div>
+       
+       {datevStatus.lastSync && (
+         <p className="text-sm text-textSecondary dark:text-gray-400 mb-4">
+           Letzte Synchronisation: {new Date(datevStatus.lastSync).toLocaleString('de-DE')}
+         </p>
+       )}
+       
+       {!datevStatus.connected && (
+         <Link to="/portal/datev">
+           <button className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-700">
+             DATEV einrichten
+           </button>
+         </Link>
+       )}
+     </div>
+   ) : (
+     <p className="text-textSecondary dark:text-gray-400">Laden...</p>
+   )}
  </div>
```

### E. Replace Activities Section (Line 300-344)

```diff
  {/* Recent System Activity */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold text-textPrimary dark:text-gray-100 mb-4">📋 {t('dashboard.sections.recentActivity')}</h2>
    
-   <div className="space-y-4">
-     <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
-       <div className="flex items-center gap-3">
-         <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
-           📄
-         </div>
-         <div>
-           <p className="font-medium text-textPrimary dark:text-gray-100">{t('dashboard.sections.documentUploaded')}</p>
-           <p className="text-sm text-textSecondary dark:text-gray-400">Jahresabschluss_2024.pdf</p>
-         </div>
-       </div>
-       <span className="text-xs text-textSecondary dark:text-gray-400">2h</span>
-     </div>
-     {/* More dummy activities... */}
-   </div>
+   {activities.length > 0 ? (
+     <div className="space-y-4">
+       {activities.map((activity, index) => (
+         <div key={activity.id || index} className="flex items-center justify-between border-b dark:border-gray-700 pb-4 last:border-b-0">
+           <div className="flex items-center gap-3">
+             <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
+               {getActivityIcon(activity.type)}
+             </div>
+             <div>
+               <p className="font-medium text-textPrimary dark:text-gray-100">{activity.description}</p>
+             </div>
+           </div>
+           <span className="text-xs text-textSecondary dark:text-gray-400">{formatRelativeTime(activity.timestamp)}</span>
+         </div>
+       ))}
+     </div>
+   ) : (
+     <p className="text-sm text-textSecondary dark:text-gray-400 text-center py-8">
+       Noch keine Aktivitäten vorhanden
+     </p>
+   )}
  </div>
```

**Why:** Real API data instead of hardcoded dummy data, proper empty states

---

## Fix 6: Contact Page - Remove Profile Menu

### File: `frontend/src/pages/public/Contact.tsx` (Line 75-114)

```diff
  <div className="px-1 py-1">
    <Menu.Item>
      {({ active }) => (
        <Link
          to="/portal/dashboard"
          className={`${
            active ? 'bg-primary text-white' : 'text-gray-900'
          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
        >
          🏠 Dashboard
        </Link>
      )}
    </Menu.Item>
-   <Menu.Item>
-     {({ active }) => (
-       <Link
-         to="/portal/profile"
-         className={`${
-           active ? 'bg-primary text-white' : 'text-gray-900'
-         } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
-       >
-         👤 Profil
-       </Link>
-     )}
-   </Menu.Item>
  </div>
  <div className="px-1 py-1">
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={logout}
          className={`${
            active ? 'bg-red-500 text-white' : 'text-red-600'
          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
        >
          🚪 Abmelden
        </button>
      )}
    </Menu.Item>
  </div>
```

**Why:** Profile menu item was redundant on public pages

---

## Backend Changes

### Fix 7: AuditController - Add Recent Activities Endpoint

**File:** `src/NFK.API/Controllers/AuditController.cs`

```diff
+ [HttpGet("recent")]
+ [Authorize]
+ public async Task<IActionResult> GetRecentActivities()
+ {
+     try
+     {
+         var activities = await _context.AuditLogs
+             .Include(a => a.User)
+             .OrderByDescending(a => a.CreatedAt)
+             .Take(5)
+             .Select(a => new
+             {
+                 a.Id,
+                 Type = a.Action,
+                 Description = FormatActivityDescription(a),
+                 Timestamp = a.CreatedAt
+             })
+             .ToListAsync();
+
+         return Ok(activities);
+     }
+     catch (Exception ex)
+     {
+         _logger.LogError(ex, "Error fetching recent activities");
+         return StatusCode(500, new { error = "internal_error", message = "Error fetching recent activities" });
+     }
+ }
+
+ private string FormatActivityDescription(Domain.Entities.Audit.AuditLog log)
+ {
+     return log.Action switch
+     {
+         "Upload" => $"Dokument hochgeladen: {log.EntityType}",
+         "Download" => $"Dokument heruntergeladen: {log.EntityType}",
+         "CreateCase" => "Neuer Fall erstellt",
+         "UpdateClient" => "Client aktualisiert",
+         "CREATE" => $"{log.EntityType} erstellt",
+         "UPDATE" => $"{log.EntityType} aktualisiert",
+         "DELETE" => $"{log.EntityType} gelöscht",
+         _ => log.Action
+     };
+ }
```

---

### Fix 8: DATEVController - Add Status Endpoint

**File:** `src/NFK.API/Controllers/DATEVController.cs`

```diff
+ [HttpGet("status")]
+ [Authorize]
+ public async Task<IActionResult> GetStatus()
+ {
+     try
+     {
+         var hasJobs = await _context.DATEVJobs.AnyAsync();
+         var isConnected = hasJobs;
+         
+         var lastSync = await _context.AuditLogs
+             .Where(a => a.Action == "DATEVExport" || a.EntityType == "DATEVJob")
+             .OrderByDescending(a => a.CreatedAt)
+             .Select(a => a.CreatedAt)
+             .FirstOrDefaultAsync();
+
+         return Ok(new
+         {
+             connected = isConnected,
+             lastSync = lastSync
+         });
+     }
+     catch (Exception ex)
+     {
+         _logger.LogError(ex, "Error fetching DATEV status");
+         return Ok(new
+         {
+             connected = false,
+             lastSync = (DateTime?)null
+         });
+     }
+ }
```

---

## Summary

**Total Changes:** ~150 lines across 7 files
**Approach:** Minimal, surgical fixes with defensive programming
**Impact:** All 8 critical bugs resolved ✅
