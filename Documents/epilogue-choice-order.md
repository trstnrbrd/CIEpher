# Epilogue exam: the order to show the choices in

**Why this file exists.** In the client's document the correct choice is **B in 7 of the 10 items**, and the pass mark is 7 out of 10. A student who understands nothing and picks the second choice every time scores exactly 7 and passes. The exam would measure nothing.

The fix needs no new content: the same four choices, shown in a different order. The game never prints the letters A-D (the client's document asks for that too), so only the position on screen matters.

**Use this order in the frontend.** The correct answer is never in the same place twice in a row, and each position is right 2 or 3 times across the exam.

| Item | 1st choice | 2nd choice | 3rd choice | 4th choice | Correct |
|---|---|---|---|---|---|
| 1 | if without parentheses | stray semicolon after if | **correct: if with braces** | no braces, missing semicolon | **3rd** |
| 2 | **correct: if...else** | if with no else | stray semicolon after if | missing semicolon after ContinueEnrollment() | **1st** |
| 3 | two separate ifs | stray semicolon after if | missing semicolon after AwardDeanScholar() | **correct: else if chain** | **4th** |
| 4 | else if chain instead of switch | **correct: switch** | case 1 missing its colon | no break statements | **2nd** |
| 5 | do...while (checks after) | for loop (count not known) | **correct: while** | missing semicolon after ProcessBorrowedBook() | **3rd** |
| 6 | while (checks before the first try) | missing semicolon after Login() | missing semicolon after while(...) | **correct: do...while** | **4th** |
| 7 | **correct: for** | while (count is known) | do...while (count is known) | missing first semicolon in the for header | **1st** |
| 8 | if with no else | **correct: if...else** | switch on a true/false value | missing semicolon after OpenGate() | **2nd** |
| 9 | else if chain instead of switch | case 1 missing its colon | **correct: switch** | no break statements | **3rd** |
| 10 | **correct: for** | while (count is known) | if (runs once, never repeats) | do...while (count is known) | **1st** |

Positions of the correct answer, in order: 3, 1, 4, 2, 3, 4, 1, 2, 3, 1.

## The choices, ready to copy

Each block is one item, in the order it should appear on screen.

### Item 1

1. wrong

```csharp
if hasID
{
    EnterCampus();
}
```

2. wrong

```csharp
if(hasID);
{
    EnterCampus();
}
```

3. **the correct one**

```csharp
if(hasID)
{
    EnterCampus();
}
```

4. wrong

```csharp
if(hasID)
    EnterCampus()
```

### Item 2

1. **the correct one**

```csharp
if(hasPaid)
{
    ContinueEnrollment();
}
else
{
    DisplayPaymentReminder();
}
```

2. wrong

```csharp
if(hasPaid)
{
    ContinueEnrollment();
}
```

3. wrong

```csharp
if(hasPaid);
{
    ContinueEnrollment();
}
else
{
    DisplayPaymentReminder();
}
```

4. wrong

```csharp
if(hasPaid)
{
    ContinueEnrollment()
}
else
{
    DisplayPaymentReminder();
}
```

### Item 3

1. wrong

```csharp
if(average >= 98)
{
    AwardPresidentScholar();
}
if(average >= 95)
{
    AwardDeanScholar();
}
else
{
    AwardCertificate();
}
```

2. wrong

```csharp
if(average >= 98);
{
    AwardPresidentScholar();
}
else if(average >= 95)
{
    AwardDeanScholar();
}
else
{
    AwardCertificate();
}
```

3. wrong

```csharp
if(average >= 98)
{
    AwardPresidentScholar();
}
else if(average >= 95)
{
    AwardDeanScholar()
}
else
{
    AwardCertificate();
}
```

4. **the correct one**

```csharp
if(average >= 98)
{
    AwardPresidentScholar();
}
else if(average >= 95)
{
    AwardDeanScholar();
}
else
{
    AwardCertificate();
}
```

### Item 4

1. wrong

```csharp
if(menu == 1)
{
    ViewClassSchedule();
}
else if(menu == 2)
{
    ViewGrades();
}
else if(menu == 3)
{
    PrintRegistrationCertificate();
}
else
{
    ShowInvalidOption();
}
```

2. **the correct one**

```csharp
switch(menu)
{
    case 1:
        ViewClassSchedule();
        break;

    case 2:
        ViewGrades();
        break;

    case 3:
        PrintRegistrationCertificate();
        break;

    default:
        ShowInvalidOption();
        break;
}
```

3. wrong

```csharp
switch(menu)
{
    case 1
        ViewClassSchedule();
        break;

    case 2:
        ViewGrades();
        break;

    default:
        ShowInvalidOption();
        break;
}
```

4. wrong

```csharp
switch(menu)
{
    case 1:
        ViewClassSchedule();

    case 2:
        ViewGrades();

    case 3:
        PrintRegistrationCertificate();

    default:
        ShowInvalidOption();
}
```

### Item 5

1. wrong

```csharp
do
{
    ProcessBorrowedBook();
}
while(processedBooks < totalBooks);
```

2. wrong

```csharp
for(int i = 0; i < totalBooks; i++)
{
    ProcessBorrowedBook();
}
```

3. **the correct one**

```csharp
while(processedBooks < totalBooks)
{
    ProcessBorrowedBook();
}
```

4. wrong

```csharp
while(processedBooks < totalBooks)
{
    ProcessBorrowedBook()
}
```

### Item 6

1. wrong

```csharp
while(loginFailed)
{
    Login();
}
```

2. wrong

```csharp
do
{
    Login()
}
while(loginFailed);
```

3. wrong

```csharp
do
{
    Login();
}
while(loginFailed)
```

4. **the correct one**

```csharp
do
{
    Login();
}
while(loginFailed);
```

### Item 7

1. **the correct one**

```csharp
for(int student = 1; student <= 30; student++)
{
    GenerateGradeReport();
}
```

2. wrong

```csharp
while(student < 30)
{
    GenerateGradeReport();
}
```

3. wrong

```csharp
do
{
    GenerateGradeReport();
}
while(student < 30);
```

4. wrong

```csharp
for(int student = 1 student <= 30; student++)
{
    GenerateGradeReport();
}
```

### Item 8

1. wrong

```csharp
if(hasPermit)
{
    OpenGate();
}
```

2. **the correct one**

```csharp
if(hasPermit)
{
    OpenGate();
}
else
{
    DisplayAccessDenied();
}
```

3. wrong

```csharp
switch(hasPermit)
{
    case true:
        OpenGate();
        break;
}
```

4. wrong

```csharp
if(hasPermit)
{
    OpenGate()
}
else
{
    DisplayAccessDenied();
}
```

### Item 9

1. wrong

```csharp
if(document == 1)
{
    RequestCertificateOfRegistration();
}
else if(document == 2)
{
    RequestCertificateOfGrades();
}
else if(document == 3)
{
    RequestGoodMoralCertificate();
}
else if(document == 4)
{
    RequestTranscriptOfRecords();
}
else
{
    ShowInvalidSelection();
}
```

2. wrong

```csharp
switch(document)
{
    case 1
        RequestCertificateOfRegistration();
        break;

    case 2:
        RequestCertificateOfGrades();
        break;

    case 3:
        RequestGoodMoralCertificate();
        break;

    default:
        ShowInvalidSelection();
        break;
}
```

3. **the correct one**

```csharp
switch(document)
{
    case 1:
        RequestCertificateOfRegistration();
        break;

    case 2:
        RequestCertificateOfGrades();
        break;

    case 3:
        RequestGoodMoralCertificate();
        break;

    case 4:
        RequestTranscriptOfRecords();
        break;

    default:
        ShowInvalidSelection();
        break;
}
```

4. wrong

```csharp
switch(document)
{
    case 1:
        RequestCertificateOfRegistration();

    case 2:
        RequestCertificateOfGrades();

    case 3:
        RequestGoodMoralCertificate();

    case 4:
        RequestTranscriptOfRecords();

    default:
        ShowInvalidSelection();
}
```

### Item 10

1. **the correct one**

```csharp
for(int currentOffice = 1; currentOffice <= totalOffices; currentOffice++)
{
    ProcessClearance();
}
```

2. wrong

```csharp
while(currentOffice <= totalOffices)
{
    ProcessClearance();
}
```

3. wrong

```csharp
if(currentOffice <= totalOffices)
{
    ProcessClearance();
}
```

4. wrong

```csharp
do
{
    ProcessClearance();
}
while(currentOffice <= totalOffices);
```

## What the client should be told

- The choices themselves were not changed, only the order they are shown in.
- The reason: with the document's order, always picking the second choice passes the exam.
- If they prefer their own order, that is fine, as long as the correct answer is not in the same position 7 times.
