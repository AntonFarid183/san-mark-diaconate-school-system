IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Users] (
    [Id] uniqueidentifier NOT NULL,
    [UserName] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] int NOT NULL,
    [RequiresPasswordChange] bit NOT NULL,
    [StudentId] uniqueidentifier NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Students] (
    [Id] uniqueidentifier NOT NULL,
    [FirstName] nvarchar(450) NOT NULL,
    [SecondName] nvarchar(450) NOT NULL,
    [ThirdName] nvarchar(450) NOT NULL,
    [LastName] nvarchar(450) NOT NULL,
    [Gender] int NOT NULL,
    [DateOfBirth] date NOT NULL,
    [Stage] int NOT NULL,
    [IsDeacon] bit NOT NULL,
    [DeaconRank] int NULL,
    [FatherOfConfession] nvarchar(max) NOT NULL,
    [FatherMobile] nvarchar(max) NOT NULL,
    [MotherMobile] nvarchar(max) NOT NULL,
    [WhatsAppNumber] nvarchar(max) NOT NULL,
    [Landline] nvarchar(max) NULL,
    [Address] nvarchar(max) NOT NULL,
    [Landmark] nvarchar(max) NULL,
    [HasPaidFees] bit NOT NULL,
    [ProfileImagePath] nvarchar(max) NULL,
    [UserId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Students] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Students_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_Student_UniqueNameAndDob] ON [Students] ([FirstName], [SecondName], [ThirdName], [LastName], [DateOfBirth]);

CREATE UNIQUE INDEX [IX_Students_UserId] ON [Students] ([UserId]);

CREATE UNIQUE INDEX [IX_Users_UserName] ON [Users] ([UserName]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260417190737_InitialCreate', N'9.0.0');

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Students]') AND [c].[name] = N'Stage');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Students] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Students] DROP COLUMN [Stage];

ALTER TABLE [Students] ADD [GradeId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

CREATE TABLE [Grades] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Level] int NOT NULL,
    [Stage] int NOT NULL,
    CONSTRAINT [PK_Grades] PRIMARY KEY ([Id])
);

IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Level', N'Name', N'Stage') AND [object_id] = OBJECT_ID(N'[Grades]'))
    SET IDENTITY_INSERT [Grades] ON;
INSERT INTO [Grades] ([Id], [Level], [Name], [Stage])
VALUES ('00000000-0000-0000-0001-000000000001', 1, N'الصف 1 الابتدائي', 2),
('00000000-0000-0000-0001-000000000002', 2, N'الصف 2 الابتدائي', 2),
('00000000-0000-0000-0001-000000000003', 3, N'الصف 3 الابتدائي', 2),
('00000000-0000-0000-0001-000000000004', 4, N'الصف 4 الابتدائي', 2),
('00000000-0000-0000-0001-000000000005', 5, N'الصف 5 الابتدائي', 2),
('00000000-0000-0000-0001-000000000006', 6, N'الصف 6 الابتدائي', 2),
('00000000-0000-0000-0002-000000000001', 1, N'الصف 1 الإعدادي', 3),
('00000000-0000-0000-0002-000000000002', 2, N'الصف 2 الإعدادي', 3),
('00000000-0000-0000-0002-000000000003', 3, N'الصف 3 الإعدادي', 3),
('00000000-0000-0000-0003-000000000001', 1, N'الصف 1 الثانوي', 4),
('00000000-0000-0000-0003-000000000002', 2, N'الصف 2 الثانوي', 4),
('00000000-0000-0000-0003-000000000003', 3, N'الصف 3 الثانوي', 4);
IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Level', N'Name', N'Stage') AND [object_id] = OBJECT_ID(N'[Grades]'))
    SET IDENTITY_INSERT [Grades] OFF;

CREATE INDEX [IX_Students_GradeId] ON [Students] ([GradeId]);

ALTER TABLE [Students] ADD CONSTRAINT [FK_Students_Grades_GradeId] FOREIGN KEY ([GradeId]) REFERENCES [Grades] ([Id]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260417205847_AddGradeEntity', N'9.0.0');

COMMIT;
GO

