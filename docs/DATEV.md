# DATEV Integration Documentation

## Overview

DATEV is Germany's leading provider of tax and accounting software. The NFK platform integrates with DATEV to export financial data in standardized formats.

## Supported Formats

### 1. EXTF (CSV Format)

**Purpose**: Export transaction data for DATEV Rechnungswesen

**Format Specification**: DATEV EXTF 7.0

**File Structure**:
```
EXTF;700;21;Buchungsstapel;8.00;
"Datum";"Umsatz";"Soll/Haben";"Konto";"Gegenkonto";"Buchungstext";"Belegnummer"
20240115;100.00;S;1000;4000;Sample Transaction;BEL001
```

**Fields**:
- Datum: Transaction date (YYYYMMDD)
- Umsatz: Amount (decimal with 2 places)
- Soll/Haben: Debit (S) or Credit (H)
- Konto: Account number
- Gegenkonto: Contra account number
- Buchungstext: Transaction text
- Belegnummer: Document number

### 2. dxso (XML Format)

**Purpose**: Export master and transaction data for DATEV Unternehmen online

**Format Specification**: DATEV dxso 6.0

**File Structure**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<document version="6.0">
  <client>
    <id>12345</id>
    <name>Acme Corp</name>
    <taxNumber>123456789</taxNumber>
  </client>
  <transactions>
    <transaction>
      <date>2024-01-15</date>
      <amount>100.00</amount>
      <type>debit</type>
      <account>1000</account>
      <contraAccount>4000</contraAccount>
      <text>Sample Transaction</text>
      <reference>BEL001</reference>
    </transaction>
  </transactions>
</document>
```

## Export Process

### 1. Job Creation

```csharp
POST /api/v1/datev/export
{
  "clientId": 1,
  "exportType": "EXTF", // or "dxso"
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31",
  "includeTransactions": true,
  "includeMasterData": false
}
```

### 2. Background Processing

1. **Validation**: Check date range, client permissions
2. **Data Extraction**: Query database for relevant records
3. **Transformation**: Convert to DATEV format
4. **Validation**: Verify format compliance
5. **File Generation**: Create CSV/XML file
6. **Storage**: Save to file system or blob storage
7. **SFTP Transfer**: Optional upload to DATEV server
8. **Notification**: Send completion email

### 3. Job Monitoring

```csharp
GET /api/v1/datev/jobs
{
  "data": [
    {
      "id": 1,
      "status": "Completed", // Pending, Processing, Completed, Failed
      "progress": 100,
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:05:00Z",
      "fileSize": 1024567,
      "recordCount": 1500
    }
  ]
}
```

## Field Mapping

### Client Master Data

| NFK Field | DATEV Field | Notes |
|-----------|-------------|-------|
| CompanyName | Name | Max 50 chars |
| TaxNumber | Steuernummer | 10-11 digits |
| VatNumber | USt-IdNr | DE + 9 digits |
| Address | Straße | Street address |
| PostalCode | PLZ | 5 digits |
| City | Ort | City name |

### Transaction Data

| NFK Field | DATEV Field | Format |
|-----------|-------------|--------|
| Date | Datum | YYYYMMDD |
| Amount | Umsatz | 0.00 |
| Type | Soll/Haben | S or H |
| AccountNumber | Konto | 4 digits |
| ContraAccount | Gegenkonto | 4 digits |
| Description | Buchungstext | Max 60 chars |
| Reference | Belegnummer | Max 12 chars |

## Validation Rules

### EXTF Format

1. **Header Line**: Must start with "EXTF;700;"
2. **Date Format**: YYYYMMDD, must be valid
3. **Amount**: Decimal with max 2 decimal places
4. **Account Numbers**: 4-digit integers
5. **Text Fields**: No line breaks, max length enforced
6. **File Encoding**: Windows-1252 or UTF-8 with BOM

### dxso Format

1. **XML Version**: 1.0, UTF-8 encoding
2. **Schema Validation**: Against DATEV dxso schema
3. **Required Fields**: client ID, name, tax number
4. **Date Format**: ISO 8601 (YYYY-MM-DD)
5. **Amount Format**: Decimal with 2 places

## Error Handling

### Common Errors

1. **Invalid Date Range**
   - Error: "End date must be after start date"
   - Solution: Check date parameters

2. **No Data Found**
   - Error: "No transactions found for the specified period"
   - Solution: Verify client has transactions

3. **Format Validation Failed**
   - Error: "Invalid account number format"
   - Solution: Check field mappings and data integrity

4. **SFTP Connection Failed**
   - Error: "Unable to connect to DATEV server"
   - Solution: Verify SFTP credentials and network connectivity

### Retry Logic

- **Automatic Retry**: Up to 3 attempts
- **Retry Delay**: Exponential backoff (1min, 5min, 15min)
- **Manual Retry**: Available via API endpoint

## SFTP Configuration

### Connection Settings

```json
{
  "DATEV": {
    "Sftp": {
      "Host": "sftp.datev.de",
      "Port": 22,
      "Username": "your_username",
      "Password": "your_password",
      "RemotePath": "/inbox",
      "Timeout": 30
    }
  }
}
```

### File Naming Convention

```
{ClientTaxNumber}_{ExportType}_{YYYYMMDD_HHMMSS}.{ext}
Example: 123456789_EXTF_20240115_103045.csv
```

### Transfer Process

1. Connect to SFTP server
2. Authenticate with username/password
3. Change to remote directory
4. Upload file with unique name
5. Verify file size matches
6. Disconnect from server

## Performance Considerations

### Optimization

- **Batch Processing**: Process records in batches of 1000
- **Streaming**: Use streaming for large datasets
- **Indexing**: Database indexes on date and client fields
- **Caching**: Cache client master data
- **Parallel Processing**: Multiple exports can run concurrently

### Limits

- **Max Records per Export**: 100,000
- **Max File Size**: 100 MB
- **Timeout**: 30 minutes
- **Concurrent Jobs**: 5 per server

## Monitoring & Logging

### Job Logs

```json
{
  "jobId": 1,
  "level": "Info", // Info, Warning, Error
  "message": "Processing started",
  "timestamp": "2024-01-15T10:00:00Z",
  "details": {
    "recordsProcessed": 100,
    "currentBatch": 1
  }
}
```

### Metrics

- Export duration
- Records processed per second
- File size
- Success/failure rate
- SFTP transfer time

## Testing

### Test Accounts

```json
{
  "testClient": {
    "id": 999,
    "taxNumber": "000000000",
    "name": "Test Client GmbH"
  }
}
```

### Sample Data

Generate test transactions for validation:
- Various account types
- Different transaction types
- Edge cases (large amounts, special characters)
- Invalid data for error testing

## Compliance

### GoBD Requirements

The German tax authorities require:
- **Completeness**: All transactions must be exported
- **Accuracy**: Data must match source records
- **Timeliness**: Exports should be regular
- **Immutability**: Original data preserved
- **Auditability**: Complete audit trail

### Data Retention

- Export files: 10 years
- Job logs: 7 years
- Error logs: 3 years

## Support

### DATEV Resources

- **Documentation**: https://www.datev.de/entwickler
- **Support**: +49 911 319-0
- **Technical Contact**: entwickler@datev.de

### Troubleshooting

1. Enable debug logging
2. Review job logs for errors
3. Validate sample files manually
4. Test SFTP connection independently
5. Contact DATEV support if needed

## Future Enhancements

1. **Real-time Sync**: Push transactions as they occur
2. **Bidirectional Sync**: Import data from DATEV
3. **Advanced Mapping**: Custom field mappings per client
4. **Validation Rules**: Client-specific validation
5. **Multi-Format**: Support additional DATEV formats
